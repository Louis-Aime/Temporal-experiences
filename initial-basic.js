/* Init Temporal polyfill for embedded. Basic process. */
var Temporal, Intl;

(async function () {
	let modules = await import ( './node_module/@js-temporal/polyfill/lib/index.mjs'); 
		// import { Temporal, Intl, toTemporalInstant } from './node_module/@js-temporal/polyfill/lib/index.mjs';
	Temporal = modules.Temporal;
	Intl = modules.Intl;
	Date.prototype.toTemporalInstant = modules.toTemporalInstant;
}) (); 