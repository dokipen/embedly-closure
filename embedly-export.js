goog.provide('embedly.exports')
goog.require('embedly.Api')

goog.exportSymbol('embedly.Api', embedly.Api)
goog.exportProperty(embedly.Api.prototype, 'call', embedly.Api.prototype.call)
goog.exportProperty(embedly.Api.prototype, 'services', embedly.Api.prototype.services)
goog.exportProperty(embedly.Api.prototype, 'services_regex', embedly.Api.prototype.services_regex)

if (typeof(embedlyOnLoad) == 'function') {
  embedlyOnLoad()
}
