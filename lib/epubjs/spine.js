EPUBJS.Spine = function(_package, _request){
  this.items = _package.spine;
  this.manifest = _package.manifest;
  this.spineNodeIndex = _package.spineNodeIndex;
  this.baseUrl = _package.baseUrl || '';
  this.request = _request;
  this.length = this.items.length;
  this.epubcfi = new EPUBJS.EpubCFI();
  this.spineItems = [];
  this.spineByHref = {};
  this.spineById = {};

  this.items.forEach(function(item, index){
    var cfiBase = this.epubcfi.generateChapterComponent(this.spineNodeIndex, item.index, item.idref);
    var href, url;
    var manifestItem = this.manifest[item.idref];
    var spineItem;

    if(manifestItem) {
      href = manifestItem.href;
      url = this.baseUrl + href;
    }

    spineItem = new EPUBJS.SpineItem(item, href, url, cfiBase);
    this.spineItems.push(spineItem);

    this.spineByHref[spineItem.href] = index;
    this.spineById[spineItem.idref] = index;


  }.bind(this));

};

// book.spine.get();
// book.spine.get(1);
// book.spine.get("chap1.html");
// book.spine.get("#id1234");
EPUBJS.Spine.prototype.get = function(target) {
  var index = 0;

  if(target && (typeof target === "number" || isNaN(target) === false)){
    index = target;
  } else if(target && target.indexOf("#") === 0) {
    index = this.spineById[target.substring(1)];
  } else if(target) {
    index = this.spineByHref[target];
  }

  return this.spineItems[index];
};


EPUBJS.SpineItem = function(item, href, url, cfiBase){
    this.idref = item.idref;
    this.linear = item.linear;
    this.properties = item.properties;
    this.index = item.index;
    this.href = href;
    this.url = url;
    this.cfiBase = cfiBase;
};


EPUBJS.SpineItem.prototype.load = function(_request){
  var request = _request || this.request || EPUBJS.core.request;
  var loading = new RSVP.defer();
  var loaded = loading.promise;

  if(this.contents) {
    loading.resolve(this.contents);
  } else {  
    request(this.url, 'xml').then(function(xml){
      var base;
      var directory = EPUBJS.core.folder(this.url);

      this.document = xml;
      this.contents = xml.documentElement;

      this.replacements(this.document);

      loading.resolve(this.contents);
    }.bind(this));
  }
  
  return loaded;
};

EPUBJS.SpineItem.prototype.replacements = function(_document){
      var base = _document.createElement("base");
      base.setAttribute("href", this.url);
      _document.head.insertBefore(base, _document.head.firstChild);
};

EPUBJS.SpineItem.prototype.render = function(){
  var rendering = new RSVP.defer();
  var rendered = rendering.promise;
  
  this.load().then(function(contents){
    var serializer = new XMLSerializer();
    var output = serializer.serializeToString(contents);
    rendering.resolve(output);
  });
  
  return rendered;
};

EPUBJS.SpineItem.prototype.find = function(_query){

};