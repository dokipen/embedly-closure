goog.provide('embedly.Api')

goog.require('goog.net.Jsonp')

/**
 * Creates a new Embedly api object that can be used to call Embedly
 * endpoints.
 *
 * @param {Object=} args An object with constructor params.  Accepted
 *     params are::
 *       key:     The Embedly Pro api key.  If this is set then we will use
 *                http://pro.embed.ly as the default host.
 *
 *       host:    The Embedly api host.  This is http://pro.embed.ly by
 *                default if 'key' is set, or http://api.embed.ly otherwise
 *
 *       timeout: Timeout in milis on calls. Default is 120000 (120 seconds)
 *
 * @constructor
 */
embedly.Api = function(args) {
  if (!args) args = {}
  if (args['key']) {
    this.key = args['key']
    this.host = args['host'] || 'http://pro.embed.ly'
  } else {
    this.host = args['host'] || 'http://api.embed.ly'
  }
  this.paths =
    { 'oembed': '/1/oembed'
    , 'objectify': '/2/objectify'
    , 'preview': '/1/preview'
    }
  this.timeout = args['timeout'] || 120000
  this.debug = args['debug'] || false
}

embedly.Api.prototype.log = function(msg) {
  if (this.debug) {
    console.log(msg)
  }
}

/**
 * Calls Embedly's limited support oembed endpoint -> api.embed.ly
 * @param {Object=} params Name value pairs to send as query params to the
 *     endpoint.  If 'key' was set in the constructor, then it will
 *     automatically be add to the params.  'urls' is required and should
 *     be an array of at least one url.
 *
 * @param {Function=} resultCallback Callback function expecting one argument
 *     that is passed resulting object returned from the endpoint.  The result
 *     is an array of Objects in that match up to the params.urls in the same
 *     order that they were given.
 *
 * @param {Function=} opt_errorCallback Callback function expecting one
 *     argument.  Usually this is called on a timeout error.
 *
 */
embedly.Api.prototype.services = function(resultCallback, opt_errorCallback) {
  var jsonp = new goog.net.Jsonp(this.host+'/1/services/javascript')
    , self = this

  jsonp.setRequestTimeout(this.timeout)
  jsonp.send(
    {}
  , function(objs) {resultCallback(objs)}
  , function(payload) {
      self.log("error getting services")
      if (opt_errorCallback) {
        opt_errorCallback(payload)
      }
    }
  )
}

/**
 * Generate a giant regex of supported service providers
 * from  api.embed.ly's services endpoint response
 * @param {Function=} resultCallback Callback function expecting one argument
 *     that is passed resulting object returned from the endpoint.  The result
 *     is an giant regex of all the supported services providers
 *
 * @param {Function=} opt_errorCallback Callback function expecting one
 *     argument.  Usually this is called on a timeout error.
 */
embedly.Api.prototype.services_regex = function(resultCallback, opt_errorCallback) {
  var self = this
  self.services(function(services_resp) {
    regexes = new Array()
    services_resp.forEach(function(service) {
      service['regex'].forEach(function(r) {
        regexes.push(r)
      })
    })
    regex = regexes.join('|')
    resultCallback(regex)
  }, opt_errorCallback )
}

/**
 * Call an Embedly endpoint.  The reply is passed to resultCallback.  If no
 * result is recieved before the timeout, then the original url parameters
 * are passed back to the opt_errorCallback.
 *
 * @param {string=} endpoint Either 'oembed', 'objectify' or 'preview'.  For
 *     non-pro accounts, this should always be 'oembed'.
 *
 * @param {Object=} params Name value pairs to send as query params to the
 *     endpoint.  If 'key' was set in the constructor, then it will
 *     automatically be add to the params.  'urls' is required and should
 *     be an array of at least one url.
 *
 * @param {Function=} resultCallback Callback function expecting one argument
 *     that is passed resulting object returned from the endpoint.  The result
 *     is an array of Objects in that match up to the params.urls in the same
 *     order that they were given.
 *
 * @param {Function=} opt_errorCallback Callback function expecting one
 *     argument.  Usually this is called on a timeout error.
 *
 * ====FLOW====
 * Uses pro.embed.ly if 'key' is supplied, else falls back upon api.embed.ly with limited support
 */

embedly.Api.prototype.call = function(endpoint, params, resultCallback, opt_errorCallback) {
  var path = this.paths[endpoint]
    , jsonp = new goog.net.Jsonp(this.host+path)
    , self = this

  if (!path) {
    if (opt_errorCallback) {
      opt_errorCallback('endpoint: '+endpoint+' not supported');
    }
    return false;
  }


  jsonp.setRequestTimeout(self.timeout)

  if (!params['key'] && self['key']) {
    params['key'] = self.key
  }

  var _call = function(params, callback, errorCallback) {
    jsonp.send(
      params
    , function(objs) {
        callback(objs, params['urls'])
      }
    , function(payload) {
        if (errorCallback) {
          errorCallback(payload)
        }
      }
    )
  }

  if(!params['key'] && endpoint == 'oembed') {
    self.services_regex(
      function(regex) {
        var return_array = new Array()
          , new_params_urls = new Array()
          , old_urls = params['urls']
        params['urls'].forEach(function(url) {
          if(!url.match(regex)) {
            return_array.push(
              { "url": url
              , "error_code": 401
              , "error_message": "This service requires an Embedly Pro account"
              , "type": "error"
              , "version": "1.0"
              }
            )
          } else {
            return_array.push('valid')
            new_params_urls.push(url)
          }
        })
        self.log(return_array)
        if (new_params_urls.length > 0) {
          params['urls'] = new_params_urls
          _call(
            params
          , function(objs) {
              objs.reverse()
              for (each in return_array) {
                self.log('testing '+each)
                if (return_array[each] == 'valid') {
                  self.log('replacing '+each)
                  return_array[each] = objs.pop()
                }
              }
              resultCallback(return_array, old_urls)
            }
          , opt_errorCallback
          )
        } else {
          resultCallback(return_array)
        }
      },
      opt_errorCallback
    )
  } else {
    _call(params, resultCallback, opt_errorCallback)
  }
}
