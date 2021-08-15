// Establishing Temporal polyfill in an ES6 module exactly as stated by polyfill instructions
// see https://github.com/js-temporal/temporal-polyfill
// 
// This entry point (index.mjs) treats Temporal as a library, and does not polyfill it onto
// the global object.
// This is in order to avoid breaking the web in the future, if the polyfill
// gains wide adoption before the API is finalized. We do not want checks such
// as `if (typeof Temporal === 'undefined')` in the wild, until browsers start
// shipping the finalized API.

// The lines for Temporal
import { Temporal, Intl, toTemporalInstant } from './node_modules/@js-temporal/polyfill/lib/index.mjs';
Date.prototype.toTemporalInstant = toTemporalInstant;
//

