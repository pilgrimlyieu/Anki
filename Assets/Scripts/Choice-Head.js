// v0.5.2 - https://github.com/SimonLammer/anki-persistence/blob/62463a7f63e79ce12f7a622a8ca0beb4c1c5d556/script.js
if (void 0 === window.Persistence) {
  var _persistenceKey = "github.com/SimonLammer/anki-persistence/",
      _defaultKey = "_default";
  if (window.Persistence_sessionStorage = function() {
          var e = !1;
          try {
              "object" == typeof window.sessionStorage && (e = !0, this.clear = function() {
                  for (var e = 0; e < sessionStorage.length; e++) {
                      var t = sessionStorage.key(e);
                      0 == t.indexOf(_persistenceKey) && (sessionStorage.removeItem(t), e--)
                  }
              }, this.setItem = function(e, t) {
                  void 0 == t && (t = e, e = _defaultKey), sessionStorage.setItem(_persistenceKey + e, JSON.stringify(t))
              }, this.getItem = function(e) {
                  return void 0 == e && (e = _defaultKey), JSON.parse(sessionStorage.getItem(_persistenceKey + e))
              }, this.removeItem = function(e) {
                  void 0 == e && (e = _defaultKey), sessionStorage.removeItem(_persistenceKey + e)
              })
          } catch (e) {}
          this.isAvailable = function() {
              return e
          }
      }, window.Persistence_windowKey = function(e) {
          var t = window[e],
              i = !1;
          "object" == typeof t && (i = !0, this.clear = function() {
              t[_persistenceKey] = {}
          }, this.setItem = function(e, i) {
              void 0 == i && (i = e, e = _defaultKey), t[_persistenceKey][e] = i
          }, this.getItem = function(e) {
              return void 0 == e && (e = _defaultKey), t[_persistenceKey][e] || null
          }, this.removeItem = function(e) {
              void 0 == e && (e = _defaultKey), delete t[_persistenceKey][e]
          }, void 0 == t[_persistenceKey] && this.clear()), this.isAvailable = function() {
              return i
          }
      }, window.Persistence = new Persistence_sessionStorage, Persistence.isAvailable() || (window.Persistence = new Persistence_windowKey("py")), !Persistence.isAvailable()) {
      var titleStartIndex = window.location.toString().indexOf("title"),
          titleContentIndex = window.location.toString().indexOf("main", titleStartIndex);
      titleStartIndex > 0 && titleContentIndex > 0 && titleContentIndex - titleStartIndex < 10 && (window.Persistence = new Persistence_windowKey("qt"))
  }
}
