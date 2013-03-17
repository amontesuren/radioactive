;(function(){


/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!has.call(require.modules, from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-clone/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
  type = require('type-component');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

});
require.register("component-to-function/index.js", function(exports, require, module){

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18"
  return new Function('_', 'return _.' + str);
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

});
require.register("component-map/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');

/**
 * Map the given `arr` with callback `fn(val, i)`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

module.exports = function(arr, fn){
  var ret = [];
  fn = toFunction(fn);
  for (var i = 0; i < arr.length; ++i) {
    ret.push(fn(arr[i], i));
  }
  return ret;
};
});
require.register("matthewp-keys/index.js", function(exports, require, module){
module.exports = Object.keys || function(obj){
  var keys = [];

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  return keys;
};
});
require.register("avetisk-defaults/index.js", function(exports, require, module){
/**
 * Expose `defaults`.
 */
module.exports = defaults;

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
function defaults (dest, defaults) {
  for (var prop in defaults) {
    if (! (prop in dest)) {
      dest[prop] = defaults[prop];
    }
  }

  return dest;
};

});
require.register("segmentio-extend/index.js", function(exports, require, module){

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
});
require.register("reinpk-zeroes/index.js", function(exports, require, module){
/**
 * Create a zeroes array with the given `dimensions`.
 *
 * @param {Number|Array} dimensions
 * @param {Number} initialValue
 * @return {Array}
 * @api public
 */

function zeroes (dimensions, initialValue) {
  var array;

  if (dimensions.length === 1) dimensions = dimensions[0];
  if (initialValue === undefined) initialValue = 0;

  // if it's a number, create a flat array of zeroes
  if (typeof dimensions === 'number') {
    array = new Array(dimensions);
    for (var i = 0; i < dimensions; i += 1) {
      array[i] = initialValue;
    }
  }
  // else create an array of one-dimension-less arrays full of zeroes
  else {
    array = new Array(dimensions[0]);
    for (var j = 0; j < dimensions[0]; j += 1) {
      array[j] = zeroes(dimensions.slice(1));
    }
  }
  return array;
}

module.exports = zeroes;
});
require.register("radioactive/src/index.js", function(exports, require, module){
// radioactive.js
//
// (c) 2013 Peter Reinhardt
// radioactive.js may be freely distributed under the MIT license.

var Radioactive = require('./radioactive');

module.exports = new Radioactive();
});
require.register("radioactive/src/radioactive.js", function(exports, require, module){
var extend      = require('extend'),
    clone       = require('clone'),
    map         = require('map'),
    keys        = require('keys'),
    defaults    = require('defaults'),
    zeroes      = require('zeroes'),
    convert     = require('./convert'),
    isotopeData = require('./isotope-data');


module.exports = Radioactive;


/**
 * Radioactive.
 */

function Radioactive () {
  var self = this;
  this.VERSION = '0.0.2';
}


/**
 * Extend the Radioactive prototype.
 */

extend(Radioactive.prototype, {

    isotopeData : isotopeData,

    // get decay products for the given isotope
    decayProducts : function (isotope) {
        var datum = isotopeData[isotope];
        if (datum && datum.product)
            return [{
                fraction : 1,
                product  : datum.product
            }];
        else if (datum && datum.products)
            return datum.products;
    },

    // get the complete decay chain for the given isotope
    decayChain : function (isotope) {
        var chain = [ isotope ];
        var decayProduct = this.decayProducts(isotope);

        while (decayProduct) {
            // choose first decay product
            decayProduct = decayProduct[0];

            // exit if this isotope is stable
            if (!isotopeData[decayProduct.product]) break;

            // add this isotope to the chain
            chain.push(decayProduct.product);

            // get next decay product
            decayProduct = this.decayProducts(decayProduct.product);
        }

        return chain;
    },

    // This prepares a decay profile for the given `charge` distribution
    // of input isotopes. Only works for one starting chain, so if you want
    // to use it for an arbitrary charge profile you need to loop over all
    // the possible chains (see the decayProfile function below).
    // It returns a dictionary of functions that can compute
    // the distribution of isotopes or radiation at any given time.
    decayChainProfile : function (isotope, charge) {

        var chain = this.decayChain(isotope);
        var C = new Array(chain.length);

        // calculate lambda coefficients
        var lambda = map(chain, function (isotope) {
            return ( Math.log(2) / isotopeData[isotope].halflife );
        });

        // coefficients for the first row
        C[0] = zeroes(chain.length);
        C[0][0] = charge[isotope] || 0;
        charge[isotope] = 0;

        // coefficients for the remaining rows
        for (var i = 1; i < chain.length; i++) {

            // initialize array to zeroes
            C[i] = zeroes(chain.length);

            var sum = 0;
            for (var k = 0; k < i; k++) {
                C[i][k] = lambda[k] * C[i-1][k] / (lambda[i] - lambda[k]);
                sum += C[i][k];
            }

            // the last coefficient (on the diagonal)
            var Ni0 = charge[chain[i]] || 0;
            C[i][i] = Ni0 - sum;
            charge[chain[i]] = 0;
        }

        // return function that can evaluate the profile for any time
        var concentrationProfile = function (years) {
            var N = {};
            N.total = 0;
            for (var i = 0; i < C.length; i++) {
                var Ni = 0;
                for (var k = 0; k < C[i].length; k++) {
                    Ni += C[i][k] * Math.exp(-lambda[k] * years);
                }
                N[chain[i]] = Math.max(0, Ni);
                N.total += N[chain[i]];
            }
            return N;
        };

        var radioactivityProfile = function (years) {
            var Bq = {};
            Bq.total = 0;
            for (var i = 0; i < C.length; i++) {
                var Ni = 0;
                for (var k = 0; k < C[i].length; k++) {
                    Ni += C[i][k] * Math.exp(-lambda[k] * years);
                }
                Bq[chain[i]] = convert.moles(lambda[i] * Math.max(0, Ni)) / (365.25 * 24 * 60 * 60);
                Bq.total += Bq[chain[i]];
            }
            return Bq;
        };

        return {
            concentration : concentrationProfile,
            radioactivity : radioactivityProfile
        };
    },

    // For any given starting profile of isotopes, returns
    // a complete decay profile for all involved chains in one
    // dictionary of time-functions for radiation & isotope distribution.
    decayProfile : function (startingProfile) {

        var charge = clone(startingProfile);
        var isotopesAtStart = keys(charge);

        var self = this;
        var profiles = map(isotopesAtStart, function (isotope) {
            return self.decayChainProfile(isotope, charge);
        });

        // Merge the concentrations from each series
        var concentrationProfile = function (years) {
            var concentration = { total : 0 };
            for (var i = 0; i < profiles.length; i++) {
                var seriesConcentration = profiles[i].concentration(years);
                concentration = defaults(concentration, seriesConcentration);
                concentration.total += seriesConcentration.total;
            }
            return concentration;
        };

        // Merge the radioactivity from each series
        var radioactivityProfile = function (years) {
            var Bq = { total : 0 };
            for (var i = 0; i < profiles.length; i++) {
                var seriesBq = profiles[i].radioactivity(years);
                Bq = defaults(Bq, seriesBq);
                Bq.total += seriesBq.total;
                console.log(seriesBq);
            }
            return Bq;
        };

        return {
            concentration : concentrationProfile,
            radioactivity : radioactivityProfile
        };
    }

});



});
require.register("radioactive/src/isotope-data.js", function(exports, require, module){
var convert = require('./convert');


// Data taken from http://en.wikipedia.org/wiki/Decay_chain during Jan & Mar 2013
module.exports = {

    // Thorium series

    'Cf-252' : {
        halflife : convert.years(2.645),
        product  : 'Cm-248'
    },
    'Cm-248' : {
        halflife : convert.years(3.4) * convert.E(5),
        product  : 'Pu-244'
    },
    'Cm-244' : {
        halflife : convert.years(18.1),
        product  : 'Pu-240'
    },
    'Pu-244' : {
        halflife : convert.years(8) * convert.E(7),
        product  : 'U-240'
    },
    'U-240' : {
        halflife : convert.hours(14.1),
        product  : 'Np-240'
    },
    'Np-240' : {
        halflife : convert.hours(1.032),
        product  : 'Pu-240'
    },
    'Pu-240' : {
        halflife : convert.years(6561),
        product  : 'U-236'
    },
    'Pu-236' : {
        halflife : convert.years(2.858),
        product  : 'U-232'
    },
    'U-236' : {
        halflife : convert.years(2.3) * convert.E(7),
        product  : 'Th-232'
    },
    'U-232' : {
        halflife : convert.years(68.9),
        product  : 'Th-228'
    },
    'Th-232' : {
        halflife : convert.years(1.405) * convert.E(10),
        product  : 'Ra-228'
    },
    'Ra-228' : {
        halflife : convert.years(5.75),
        product  : 'Ac-228'
    },
    'Ac-228' : {
        halflife : convert.hours(6.25),
        product  : 'Th-228'
    },
    'Th-228' : {
        halflife : convert.years(1.9116),
        product  : 'Ra-224'
    },
    'Ra-224' : {
        halflife : convert.days(3.6319),
        product  : 'Rn-220'
    },
    'Rn-220' : {
        halflife : convert.seconds(55.6),
        product  : 'Po-216'
    },
    'Po-216' : {
        halflife : convert.seconds(0.145),
        product  : 'Pb-212'
    },
    'Pb-212' : {
        halflife : convert.hours(10.64),
        product  : 'Bi-212'
    },
    'Bi-212' : {
        halflife : convert.minutes(60.55),
        products : [
            {
                fraction : 0.6406,
                product  : 'Po-212'
            },
            {
                fraction : 0.3594,
                product  : 'Tl-208'
            }
        ]
    },
    'Po-212' : {
        halflife : convert.seconds(299) * convert.E(-9),
        product  : 'Pb-208'
    },
    'Tl-208' : {
        halflife : convert.minutes(3.053),
        product  : 'Pb-208'
    },



    // Neptunium series

    'Cf-249' : {
        halflife : convert.years(351),
        product  : 'Cm-245'
    },
    'Cm-245' : {
        halflife : convert.years(8500),
        product  : 'Pu-241'
    },
    'Pu-241' : {
        halflife : convert.years(14.4),
        product  : 'Am-241'
    },
    'Am-241' : {
        halflife : convert.years(432.7),
        product  : 'Np-237'
    },
    'Np-237' : {
        halflife : convert.years(2.14) * convert.E(6),
        product  : 'Pa-233'
    },
    'Pa-233' : {
        halflife : convert.days(27.0),
        product  : 'U-233'
    },
    'U-233' : {
        halflife : convert.years(1.592) * convert.E(5),
        product  : 'Th-229'
    },
    'Th-229' : {
        halflife : convert.years(7340),
        product  : 'Ra-225'
    },
    'Ra-225' : {
        halflife : convert.days(14.9),
        product  : 'Ac-225'
    },
    'Ac-225' : {
        halflife : convert.days(10.0),
        product  : 'Fr-221'
    },
    'Fr-221' : {
        halflife : convert.minutes(4.8),
        product  : 'At-217'
    },
    'At-217' : {
        halflife : convert.seconds(32) * convert.E(-3),
        product  : 'Bi-213'
    },
    'Bi-213' : {
        halflife : convert.minutes(46.5),
        products : [
            {
                fraction : 0.9780,
                product  : 'Po-213'
            },
            {
                fraction : 0.022,
                product  : 'Tl-209'
            }
        ]
    },
    'Po-213' : {
        halflife : convert.seconds(3.72) * convert.E(-6),
        product  : 'Pb-209'
    },
    'Tl-209' : {
        halflife : convert.minutes(2.2),
        product  : 'Pb-209'
    },
    'Pb-209' : {
        halflife : convert.hours(3.25),
        product  : 'Bi-209'
    },
    'Bi-209' : {
        halflife : convert.years(1.9) * convert.E(19),
        product  : 'Tl-205'
    },


    // Radium series (aka uranium series)
    'Am-242' : {
        halflife : convert.hours(16.02),
        product  : 'Cm-242'
    },
    'Cm-242' : {
        halflife : convert.days(162.8),
        product  : 'Pu-238'
    },
    'Pu-242' : {
        halflife : convert.years(376) * convert.E(3),
        product  : 'U-238'
    },
    'Pu-238' : {
        halflife : convert.years(87.7),
        product  : 'U-234'
    },
    'U-238' : {
        halflife : convert.years(4.468) * convert.E(9),
        product  : 'Th-234'
    },
    'Th-234' : {
        halflife : convert.days(24.10),
        product  : 'Pa-234m'
    },
    'Pa-234m' : {
        halflife : convert.minutes(1.16),
        products : [
            {
                fraction : 0.9984,
                product  : 'U-234'
            },
            {
                fraction : 0.0016,
                product  : 'Pa-234'
            }
        ]
    },
    'Pa-234' : {
        halflife : convert.hours(6.70),
        product  : 'U-234'
    },
    'U-234' : {
        halflife : convert.years(245500),
        product  : 'Th-230'
    },
    'Th-230' : {
        halflife : convert.years(75380),
        product  : 'Ra-226'
    },
    'Ra-226' : {
        halflife : convert.years(1602),
        product  : 'Rn-222'
    },
    'Rn-222' : {
        halflife : convert.days(3.8235),
        product  : 'Po-218'
    },
    'Po-218' : {
        halflife : convert.minutes(3.10),
        products : [
            {
                fraction : 0.9998,
                product  : 'Pb-214'
            },
            {
                fraction : 0.0002,
                product  : 'At-218'
            }
        ]
    },
    'At-218' : {
        halflife : convert.seconds(1.5),
        products : [
            {
                fraction : 0.9990,
                product  : 'Bi-214'
            },
            {
                fraction : 0.0010,
                product  : 'Rn-218'
            }
        ]
    },
    'Rn-218' : {
        halflife : convert.seconds(35) * convert.E(-3),
        product  : 'Po-214'
    },
    'Pb-214' : {
        halflife : convert.minutes(26.8),
        product  : 'Bi-214'
    },
    'Bi-214' : {
        halflife : convert.minutes(19.9),
        products : [
            {
                fraction : 0.9998,
                product  : 'Po-214'
            },
            {
                fraction : 0.0002,
                product  : 'Tl-210'
            }
        ]
    },
    'Po-214' : {
        halflife : convert.seconds(164.3) * convert.E(-6),
        product  : 'Pb-210'
    },
    'Tl-210' : {
        halflife : convert.minutes(1.30),
        product  : 'Pb-210'
    },
    'Pb-210' : {
        halflife : convert.years(22.3),
        product  : 'Bi-210'
    },
    'Bi-210' : {
        halflife : convert.days(5.013),
        products : [
            {
                fraction : 0.9999987,
                product  : 'Po-210'
            },
            {
                fraction : 0.0000013,
                product  : 'Tl-206'
            }
        ]
    },
    'Po-210' : {
        halflife : convert.days(138.376),
        product  : 'Pb-206'
    },
    'Tl-206' : {
        halflife : convert.minutes(4.199),
        product  : 'Pb-206'
    },


    // Actinium series

    'Am-243' : {
        halflife : convert.years(7370),
        product  : 'Np-239'
    },
    'Np-239' : {
        halflife : convert.days(2.356),
        product  : 'Pu-239'
    },
    'Pu-239' : {
        halflife : convert.years(2.41) * convert.E(4),
        product  : 'U-235'
    },
    'U-235' : {
        halflife : convert.years(7.04) * convert.E(8),
        product  : 'Th-231'
    },
    'Th-231' : {
        halflife : convert.hours(25.52),
        product  : 'Pa-231'
    },
    'Pa-231' : {
        halflife : convert.years(32760),
        product  : 'Ac-227'
    },
    'Ac-227' : {
        halflife : convert.years(21.772),
        products : [
            {
                fraction : 0.9862,
                product  : 'Th-227'
            },
            {
                fraction : 0.0138,
                product  : 'Fr-223'
            }
        ]
    },
    'Th-227' : {
        halflife : convert.days(18.68),
        product  : 'Ra-223'
    },
    'Fr-223' : {
        halflife : convert.minutes(22.00),
        products : [
            {
                fraction : 0.99994,
                product  : 'Ra-223'
            },
            {
                fraction : 0.00006,
                product  : 'At-219'
            }
        ]
    },
    'Ra-223' : {
        halflife : convert.days(11.43),
        product  : 'Rn-219'
    },
    'At-219' : {
        halflife : convert.seconds(56),
        products : [
            {
                fraction : 0.9700,
                product  : 'Bi-215'
            },
            {
                fraction : 0.0300,
                product  : 'Rn-219'
            }
        ]
    },
    'Rn-219' : {
        halflife : convert.seconds(3.96),
        product  : 'Po-215'
    },
    'Bi-215' : {
        halflife : convert.minutes(7.6),
        product  : 'Po-215'
    },
    'Po-215' : {
        halflife : convert.seconds(1.781) * convert.E(-3),
        products : [
            {
                fraction : 0.9999977,
                product  : 'Pb-211'
            },
            {
                fraction : 0.0000023,
                product  : 'At-215'
            }
        ]
    },
    'At-215' : {
        halflife : convert.seconds(0.1) * convert.E(-3),
        product  : 'Bi-211'
    },
    'Pb-211' : {
        halflife : convert.minutes(36.1),
        product  : 'Bi-211'
    },
    'Bi-211' : {
        halflife : convert.minutes(2.14),
        products : [
            {
                fraction : 0.99724,
                product  : 'Tl-207'
            },
            {
                fraction : 0.00276,
                product  : 'Po-211'
            }
        ]
    },
    'Po-211' : {
        halflife : convert.seconds(516) * convert.E(-3),
        product  : 'Pb-207'
    },
    'Tl-207' : {
        halflife : convert.minutes(4.77),
        product  : 'Pb-207'
    },


    // Fission products

    // strontium-90
    'Sr-90' : {
        halflife : convert.years(28.8),
        product  : 'Y-90'
    },
    'Y-90' : {
        halflife : convert.hours(64),
        product  : 'Zr-90'
    },

    // cesium-134
    'Cs-134' : {
        halflife : convert.years(2.0652),
        product  : 'Ba-134'
    },

    // cesium-137
    'Cs-137' : {
        halflife : convert.years(30.17),
        product  : 'Ba-137m'
    },
    'Ba-137m' : {
        halflife : convert.seconds(153),
        product  : 'Ba-137'
    },


    // light
    'Y-99' : {
        halflife : convert.seconds(1.470),
        product  : 'Zr-99'
    },
    'Zr-99' : {
        halflife : convert.seconds(2.1),
        product  : 'Nb-99m'
    },
    'Nb-99m' : {
        halflife : convert.minutes(2.6),
        product  : 'Nb-99'
    },
    'Nb-99' : {
        halflife : convert.seconds(15.0),
        product  : 'Mo-99m2'
    },
    'Mo-99m2' : {
        halflife : convert.seconds(0.76) * convert.E(-3),
        product  : 'Mo-99m1'
    },
    'Mo-99m1' : {
        halflife : convert.seconds(15.5) * convert.E(-3),
        product  : 'Mo-99'
    },
    'Mo-99' : {
        halflife : convert.days(2.7489),
        product  : 'Tc-99m'
    },
    'Tc-99m' : {
        halflife : convert.hours(6.0058),
        product  : 'Tc-99'
    },
    'Tc-99' : {
        halflife : convert.years(2.11) * convert.E(5),
        product  : 'Ru-99'
    },

    // heavy
    'Te-135' : {
        halflife : convert.seconds(19.0),
        product  : 'I-135'
    },
    'I-135' : {
        halflife : convert.hours(6.57),
        product  : 'Xe-135'
    },
    'Xe-135' : {
        halflife : convert.hours(9.14),
        product  : 'Cs-135'
    },
    'Cs-135' : {
        halflife : convert.years(2.3) * convert.E(6),
        product  : 'Ba-135'
    },

    // europium 154
    'Eu-154' : {
        halflife : convert.years(8.593),
        product  : 'Gd-154'
    }

};
});
require.register("radioactive/src/convert.js", function(exports, require, module){
// date and unit conversion utilities

module.exports = {
    
    E : function (exponent) {
        return Math.pow(10, exponent);
    },
    years : function (years) {
        return years;
    },
    days : function (days) {
        return ( days / 365.25);
    },
    hours : function (hours) {
        return ( hours / (24 * 365.25) );
    },
    minutes : function (minutes) {
        return ( minutes / (60 * 24 * 365.25) );
    },
    seconds : function (seconds) {
        return ( seconds / (60 * 60 * 24 * 365.25) );
    },

    moles : function (moles) {
        return (moles * 6.02214179 * Math.pow(10, 23));
    }
};
});
require.alias("component-clone/index.js", "radioactive/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-map/index.js", "radioactive/deps/map/index.js");
require.alias("component-to-function/index.js", "component-map/deps/to-function/index.js");

require.alias("matthewp-keys/index.js", "radioactive/deps/keys/index.js");
require.alias("matthewp-keys/index.js", "radioactive/deps/keys/index.js");
require.alias("matthewp-keys/index.js", "matthewp-keys/index.js");

require.alias("avetisk-defaults/index.js", "radioactive/deps/defaults/index.js");

require.alias("segmentio-extend/index.js", "radioactive/deps/extend/index.js");

require.alias("reinpk-zeroes/index.js", "radioactive/deps/zeroes/index.js");

require.alias("radioactive/src/index.js", "radioactive/index.js");

if (typeof exports == "object") {
  module.exports = require("radioactive");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("radioactive"); });
} else {
  window["radioactive"] = require("radioactive");
}})();