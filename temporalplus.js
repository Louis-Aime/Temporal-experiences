/** Additions to Temporal. 
 * Add function toDateString() to Temporal.PlainDate's prototype, that gives a coded representation of a PlainDate object with its calendar. 
 * Such a definition needs a separate file from calendars.js.
 * @file 
 * @version M2021-08-26
 * @author Louis A. de Fouquières https://github.com/Louis-Aime
 * @license MIT 2016-2022
 * @requires Temporal
*/
/* Version	M2022-03-15 JSDoc
	M2021-08-26 set as independant file
*/
/* Copyright Louis A. de FOUQUIERES 2021 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in  the Software without restriction, including
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
'use strict'
/** Give a coded representation of a PlainDate object with its calendar.
 * @function
 * @name Temporal.PlainDate.toDateString
*/
Temporal.PlainDate.prototype.toDateString = function () { 
	let ey = this.eraYear,
		yearParts = ey == undefined ? [this.year] : [ey, this.era];
	return  "[" + this.calendar.id + "]" 
		+ this.day + "." + this.monthCode + "."
		+ new Intl.NumberFormat('en-US', {minimumIntegerDigits : 4, useGrouping : false}).format (yearParts[0])
		+ (yearParts.length > 1 ? "." + yearParts[1] : "")
}
