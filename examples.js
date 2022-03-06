/** A selection of calendar objects for tries with Temporal. 
 * Class MilesianCalendar, JulianCalendar and WesternCalendar are required from calendars-temporal.js.
 * Custom calendars are: milesian, julian, vatican, french, german, english, swiss.
 * Global variables begin with: p (duration), l (options for units), v (overflow options), r(ecord), d(ate), md (month-day), ym (year-month)
 * @file
 * @version M2021-08-26
 * @author Louis A. de Fouquières https://github.com/Louis-Aime
 * @license MIT 2016-2022
 * @requires Temporal
 * @requires calendars-temporal.js
*/ 
/* Version	Version M2022-03-15 JSDoc
	M2021-08-26 separate additions to Temporal
	M2021-08-25 set as a module
	M2021-06-13 duration options in singular, change rcerv (bug)
	M2021-02-09 separate [era,eraYear] and [year]
	M2021-02-03	use year and eraYear
	M2020-11-23 - adapt to new names in Temporal
	M2020-11-14 - add a few variables
	M2020-11-13	eras in lowercase
*/
/* Copyright Miletus 2020 - Louis A. de FOUQUIERES
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
	1. The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	2. Changes with respect to any former version shall be documented.

The software is provided "as is", without warranty of any kind,
express of implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose and noninfringement.
In no event shall the authors of copyright holders be liable for any
claim, damages or other liability, whether in an action of contract,
tort or otherwise, arising from, out of or in connection with the software
or the use or other dealings in the software.
Inquiries: www.calendriermilesien.org
*/
// No 'use strict';, declared variables are global variables.

var 
	pd1 = Temporal.Duration.from ("P1D"),
	pd3 = Temporal.Duration.from ("P3D"),
	pd30 = Temporal.Duration.from ("P30D"),
	pd40 = Temporal.Duration.from ("P40D"),
	phd1 = Temporal.Duration.from("P1DT720H"),
	pm1 = Temporal.Duration.from ("P1M"),
	pm11 = Temporal.Duration.from ("P11M"),
	pm13 = Temporal.Duration.from ("P13M"),
	py1 = Temporal.Duration.from ("P1Y"),
	py4 = Temporal.Duration.from ("P4Y"),
	pnm1 = Temporal.Duration.from ("-P1M"),
	pnm13 = Temporal.Duration.from ("-P13M"),
	py20 = Temporal.Duration.from ("P20Y"),
	pCinderella = Temporal.Duration.from("P300Y");

var
	lua = { largestUnit : "auto", smallestUnit : "day" },
	lud = { largestUnit : "day", smallestUnit : "day" },
	luw = { largestUnit : "week", smallestUnit : "day" },
	lum = { largestUnit : "month", smallestUnit : "day" },
	luy = { largestUnit : "year", smallestUnit : "day" },
	vc = { overflow : "constrain" },
	vr = { overflow : "reject" },
	vb = { overflow : "balance" };

loadCalendrical.then ( () => {	
	
	milesian = new myCalendars.MilesianCalendar ("milesian"),
	julian = new myCalendars.JulianCalendar ("julian"),
	vatican = new myCalendars.WesternCalendar ("vatican","1582-10-15"),
	french = new myCalendars.WesternCalendar ("french","1582-12-20"),
	german = new myCalendars.WesternCalendar ("german","1700-03-01"),
	english = new myCalendars.WesternCalendar("english","1752-09-14"),
	swiss = new myCalendars.WesternCalendar("swiss","1701-01-12"),

	rm1 = { year : 201, month : 1, day : 15 },
	rm2 = { year : 325, month : 3, day : 21},
	rm3 = { year : 325, month : 3, day : 30, calendar : milesian},
	rm4 = { year : -752, month : 4, day : 31, calendar : milesian},
	r31 = { year : 1600, month : 1, day : 31, calendar : julian},
	rauc = { year : -752, month : 4, day : 21, calendar : julian },
	rann = { era : "e0", eraYear : 1, month : 3, day : 25, calendar : julian },
	rinc = { year : 8, month : 8, day : 29, calendar : julian },
	rchr = { year : 1, month : 1, day : 1, calendar : vatican },
	r201 = { year : 201, month : 3, day : 1, calendar : julian },
	rljul = { year : 1582, month : 10, day : 4, calendar : vatican },
	rfgreg = { year : 1582, month : 10, day : 15, calendar : vatican },
	rger1 = { year : 1700, month : 2, day : 18, calendar : german },
	rger2 = { year : 1700, month : 3, day : 1, calendar : german },
	rger3 = { year : 1700, month : 1, day : 28, calendar : german },
	rger4 = { era : "e0", eraYear : 753, month : 4, day : 21, calendar : german },
	rshak = { era : "e1", eraYear : 1616, month : 4, day : 23, calendar : english },
	rcerv = { era : "e2", eraYear : 1616, month : 4, day : 23, calendar : vatican },
	rswiss1 = { year : 1700, month : 12, day : 31, calendar  : swiss },
	rswiss2 = { year : 1701, month : 1, day : 12, calendar  : swiss },
	
	mdmlast = Temporal.PlainMonthDay.from ({month : 12, day : 31, calendar : milesian}),
	mdmun = Temporal.PlainMonthDay.from ({month : 1, day : 12, calendar : milesian}),
	mdmbis = Temporal.PlainMonthDay.from ({month : 3, day : 9, calendar : milesian}),
	ymmun = Temporal.PlainYearMonth.from ({year : 2020, month : 1, calendar : milesian}),
	ymms = Temporal.PlainYearMonth.from ({year : 2018, month : 12, calendar : milesian}),
	ymml = Temporal.PlainYearMonth.from ({year : 2019, month : 12, calendar : milesian}),
	dm1 = Temporal.PlainDate.from(rm1),
	dm2 = Temporal.PlainDate.from(rm2),
	dm3 = Temporal.PlainDate.from(rm3),
	dm4 = Temporal.PlainDate.from(rm4), 
	d31 = Temporal.PlainDate.from(r31),
	dauc = Temporal.PlainDate.from(rauc),
	dann = Temporal.PlainDate.from(rann),
	dinc = Temporal.PlainDate.from(rinc),
	dchr = Temporal.PlainDate.from(rchr),
	d201 = Temporal.PlainDate.from(r201),
	dljul = Temporal.PlainDate.from(rljul),
	dfgreg = Temporal.PlainDate.from(rfgreg),
	dger1 = Temporal.PlainDate.from(rger1),
	dger2 = Temporal.PlainDate.from(rger2),
	dger3 = Temporal.PlainDate.from(rger3),
	dger4 = Temporal.PlainDate.from(rger4),
	dshak = Temporal.PlainDate.from(rshak),
	dcerv = Temporal.PlainDate.from(rcerv),
	dswiss1 = Temporal.PlainDate.from(rswiss1),
	dswiss2 = Temporal.PlainDate.from(rswiss2);

})
