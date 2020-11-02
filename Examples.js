/* A selection of calendar for tries with Temporal
*/
/* uses: Chronos, MilesianCalendar, JulianCalendar, WesternCalendar
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

var
	rm1 = { year : 201, month : 1, day : 15 },
	rm2 = { year : 325, month : 3, day : 21},
	rm3 = { year : 325, month : 3, day : 30, calendar : milesian}
	rm4 = { year : 2020, month : 10, day : 31, calendar : milesian}
	rauc = { era : "BC", year : 753, month : 4, day : 21, calendar : julian },
	rbc = { era : "BC", year : 1, month : 3, day : 1, calendar : julian },
	rinc = { year : 8, month : 8, day : 29, calendar : julian },
	rheg = { year : 1, month : 1, day : 1, calendar : vatican },
	r201 = { year : 201, month : 1, day : 15, calendar : julian },
	rgreg = { year : 1582, month : 10, day : 4, calendar : vatican },
	rger = { year : 1700, month : 3, day : 1, calendar : german },
	rshak = { era : "AS", year : 1616, month : 4, day : 23, calendar : german },
	rcerv = { era : "NS", year : 1616, month : 4, day : 23, calendar : german };

var 
	pd1 = Temporal.Duration.from ("P1D"),
	pd30 = Temporal.Duration.from ("P30D"),
	pm1 = Temporal.Duration.from ("P1M"),
	pm11 = Temporal.Duration.from ("P11M"),
	py1 = Temporal.Duration.from ("P1Y"),
	py4 = Temporal.Duration.from ("P4Y"),
	pnm11 = Temporal.Duration.from ("-P11M");
	
var
	oa = { largestUnit : "auto" },
	od = { largestUnit : "day" },
	ow = { largestUnit : "week" },
	om = { largestUnit : "month" },
	oy = { largestUnit : "year" };
	
var	
	mdmlast = Temporal.MonthDay.from ({month : 12, day : 31, calendar : milesian}),
	mdmun = Temporal.MonthDay.from ({month : 1, day : 12, calendar : milesian}),
	mdmbis = Temporal.MonthDay.from ({month : 3, day : 9, calendar : milesian}),
	ymmun = Temporal.YearMonth.from ({year : 2020, month : 1, calendar : milesian}),
	ymms = Temporal.YearMonth.from ({year : 2018, month : 12, calendar : milesian}),
	ymml = Temporal.YearMonth.from ({year : 2019, month : 12, calendar : milesian}),
	dm1 = Temporal.Date.from(rm1),
	dm2 = Temporal.Date.from(rm2),
	dm3 = Temporal.Date.from(rm3),
	dm4 = Temporal.Date.from(rm4), 
	dauc = Temporal.Date.from(rauc),
	dbc = Temporal.Date.from(rbc),
	dinc = Temporal.Date.from(rinc),
	dheg = Temporal.Date.from(rheg),
	d201 = Temporal.Date.from(r201),
	dgreg = Temporal.Date.from(rgreg),
	dger = Temporal.Date.from(rger),
	dshak = Temporal.Date.from(rshak),
	dcerv = Temporal.Date.from(rcerv);