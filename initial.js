/* initialisation with imports */
var modules;
(async function () {
	modules = await import ( './clocktools_import.js');
	const 
		Temporal = modules.Temporal, Intl = modules.Intl, 
		Milliseconds = modules.Milliseconds, Chronos = modules.Chronos, WeekClock = modules.WeekClock, IsoCounter = modules.IsoCounter;
	Date.prototype.toTemporalInstant = modules.toTemporalInstant;
	let pldrString = await import ('@Louis-Aime/calendrical-javascript/pldr.js');
	let	pldrDOM = await fetchDOM ("https://louis-aime.github.io/Milesian-calendar/pldr.xml")
			.then ( (pldrDOM) => pldrDOM ) // The pldr data used by the Milesian calendar (and possibly others).
			.catch ( (error) => { return pldrString.default() } );	// if error (no XML file) take default pldr 
}) ();