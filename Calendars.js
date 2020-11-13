/* A selection of calendar for tries with Temporal
*/
/* Version M2020-11-23 - all calendars defined in the same file. Do not subclass basic calendars. Personal toDateString enhanced. Subtract method suppressed. No time method (no harm)
*/
/* Required: 
	Chronos.js
		class Chronos
		class JulianDayIso
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
"use strict";
const JDConvert = new JulianDayIso(1);	// ISO8601 to Julian Day bidirectional conversion, with month number starting at 1

class MilesianCalendar {
	constructor () {
		this.id = "milesian";	// this is of the same level as i"so8601", "gregory" etc.
		this.updateRegister (MilesianCalendar.originDate); 	// Initiate register
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	fields (theFields) {return theFields} // nothing to add to the standard fields year, month, day
	toString () {return this.id}
	static from (thing) {return Temporal.Calendar.from(thing)}	// This should not be used, but just in case.
	/* Basic calendar-specific objects 
	*/
	static invalidOption = new RangeError ("unknown option")
	static dateUnderlow = new RangeError ("date element underflow")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
	static mixingCalendar = new TypeError ("until or since operation requires same calendar")
	milesianClockwork = new Chronos ( { // To be used with day counter from M000-01-01 ie ISO -000001-12-22. Decompose into Milesian year, month, day.
		timeepoch : 1721050, // Julian Day at 1 1m 000 i.e. -000001-12-22
		coeff : [ 
		  {cyclelength : 146097, ceiling : Infinity, subCycleShift : 0, multiplier : 400, target : "year"},
		  {cyclelength : 36524, ceiling :  3, subCycleShift : 0, multiplier : 100, target : "year"},
		  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "year"},
		  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "year"},
		  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"},
		  {cyclelength : 30, ceiling : 1, subCycleShift : 0, multiplier : 1, target : "month"}, 
		  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
		],
		canvas : [ 
			{name : "year", init: 0},
			{name : "month", init: 1},
			{name : "day", init : 1}
		]
		},	// end of calendRule
		{	// weekdayRule
			originWeekday: 4, 		// Use day part of Posix timestamp, week of day of 1970-01-01 is Thursday
			daysInYear: (year) => (Chronos.isGregorianLeapYear( year + 1 ) ? 366 : 365),		// leap year rule for Milesian calendar
			startOfWeek : 0,		// week start with 0
			characWeekNumber : 0,	// we have a week 0 and the characteristic day for this week is 7 1m.
			dayBase : 0,			// use 0..6 display for weekday
			weekBase : 0,			// number of week begins with 0
			weekLength : 7			// the Milesian week is the 7-days well-known week
		}
		)	// end of parameter list
	/* Internal objects: Origin date and last date worked out
	*/
	static originDate = Temporal.PlainDate.from ("-000001-12-22") // This information should probably be part of params object
	register = {	//This internal objects avoids redoing computations at each call of properties for a same date.
		year : 0, month : 1, day : 1, index : 0,	
		weekOfYear : 0, dayOfWeek : 0, weekYearOffset : 0, weeksInYear : 0 }   
	updateRegister (date) { // update internal register to date given as a parameter.
		let index = JDConvert.toJulianDay (date.getISOFields());
		if (index !=  this.register.index) {
			this.register.index = index;
			this.register = Object.assign (this.register, this.milesianClockwork.getObject (this.register.index));
			// Week figures computations.
			let weekCharacFields = { year : this.register.year, month : 1, day : 7 },
				weekCharacIndex = this.milesianClockwork.getNumber(weekCharacFields);	// Day index of one day in week 1 for this year
			[this.register.weekOfYear, this.register.dayOfWeek, this.register.weekYearOffset, this.register.weeksInYear] 
				= this.milesianClockwork.getWeekFigures (this.register.index, weekCharacIndex, this.register.year);
		}
	}
	/* Main date and Temporal objects generator from fields representing a Milesian date. 
	 Note that the Temporal. object shall be initiated with the ISO representation.
	*/ 
	dateFromFields (askedComponents, options, Construct=Temporal.PlainDate) { // no default value for options = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : askedComponents.day }; 
		switch (options.overflow) {
			case undefined : options.overflow = "constrain"; 
			case "constrain" : case "reject" : break;		// case "balance" is not authorised
			default : throw MilesianCalendar.invalidOption;
		}
		// NaN or non-integer shall be thrown from Chronos.
		if (components.month < 1 || components.month > 12) throw MilesianCalendar.outOfRangeDateElement; // always reject months indication that cannot be handled
		// if (components.day < 1) throw MilesianCalendar.dateUnderflow;
		let overflow = 
			components.day < 1
			|| components.day > 31
			|| (components.day > 30 
				&& ( components.month % 2 == 1 || (components.month == 12 && ! Chronos.isGregorianLeapYear (components.year + 1))));
		if (overflow && options.overflow == "reject") throw MilesianCalendar.dateOverflow;
		if (overflow && options.overflow == "constrain") {
			components.day = Math.min (components.day, 
				(( components.month % 2 == 1 || (components.month == 12 && ! Chronos.isGregorianLeapYear (components.year + 1))) ? 30 : 31));
			components.day = Math.max (components.day, 1);
		}
		// compute index from elements, but do not save this date, nor the index.
		let index = this.milesianClockwork.getNumber(components), // Date elements first tested.
			isoFields = JDConvert.toIsoFields (index);
		return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this);
	}
	yearMonthFromFields (askedComponents, askedOptions, Construct=Temporal.PlainYearMonth) { // askedOptions = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : 13 }; // Year and month for that day is always the same in Milesian and ISO 8601
		let myDate = this.dateFromFields(components, askedOptions);
		let myFields = myDate.getFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myFields.year, myFields.month, this, 13);
	}
	monthDayFromFields (askedComponents, askedOptions, Construct=Temporal.PlainMonthDay) { // askedOptions = {overflow : "constrain"}
		var components = { year : 1999, month : askedComponents.month, day : askedComponents.day }; // 1999 is a Milesian long year after Unix epoch, following the most complex rule
		let myDate = this.dateFromFields(components, askedOptions);
		let myFields = myDate.getISOFields();
		return new Construct(myFields.isoMonth, myFields.isoDay, this, 1999);
	}
	/* Methods for elements of date
	*/
	year (date) {
		this.updateRegister (date);
		return this.register.year
	}
	month (date) {
		this.updateRegister (date);
		return this.register.month
	}
	day (date) {
		this.updateRegister (date);
		return this.register.day
		}
	era (date) { return undefined }
	daysInWeek (date) {return 7}
	dayOfWeek (date) {
		this.updateRegister (date);
		return this.register.dayOfWeek
		// return mod (this.register.index+2, 7) + 1 // originDate (offset 0) is a Wednesday, and weekdays are counted 1 (Monday) to 7 (Sunday)
	}
	daysInYear (date){
		return (this.inLeapYear(date) ? 366 : 365) // this.updateRegister(date) implied
	}
	dayOfYear (date) {
		this.updateRegister(date);
		let m = this.register.month - 1;
		return this.register.day + 30*(m % 2) + 61*Math.floor (m/2)
	}
	weekOfYear (date) {	
		this.updateRegister(date);
		return this.register.weekOfYear
	} 
	yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date. In fact, weekYearOffset is more general
		this.updateRegister(date);
		return this.register.year + this.register.weekYearOffset
	}
	weekYearOffset (date) {	// Proposal. This is more general than just giving the year.
		this.updateRegister(date);
		return this.register.weekYearOffset
	}
	daysInMonth (date) {
		this.updateRegister(date);
		let m = this.register.month - 1;
		return m % 2 == 0 ? 30 : ( m == 11 && ! Chronos.isGregorianLeapYear (this.register.year + 1) ? 30 : 31)
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) {
		this.updateRegister (date);
		return Chronos.isGregorianLeapYear (this.register.year + 1)
	}
	/* Methods for use with Duration.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options, Construct) {// Add a +/- duration - // no default value options={overflow:"constrain"}
		this.updateRegister(date);
		// 1. Build new date components from duration years and months
		let components = {...this.register};
		let addedYearMonth = Chronos.divmod ( this.register.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		// dateFromFields shall handle overflow option
		let dateOne = this.dateFromFields (components, options, Construct);
		// 2. Add or subtract days to final result
		let resultFields = JDConvert.toIsoFields(JDConvert.toJulianDay(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options) { // no default value for options, was ={largestUnit:"auto"}
		if (smaller.calendar.id != larger.calendar.id) throw MilesianCalendar.mixingCalendar;
		switch (options.largestUnit) {
			case "auto": case "years": case "months": case "weeks": case "days": break; // normally "weeks" should not be implemented
			default : throw MilesianCalendar.invalidOption
		}
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // throw MilesianCalendar.invalidOrder; break;
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { year : larger.year, month : larger.month, day : larger.day },
					mySmaller = { year : smaller.year, month : smaller.month, day : smaller.day },
					myDayOffset = this.milesianClockwork.getNumber(myLarger) - this.milesianClockwork.getNumber(mySmaller),
					myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
	/* 
	It could seem more logical to distinguish between 30 == last day of month, and 30 == not the last one
	In practical, better results are obtained by cutting all months to 30.
				myLarger.day = larger.day == larger.daysInMonth ? 31 : larger.day;	// For computation, all months finish on 30. Variant: on 31.
				mySmaller.day = smaller.day == smaller.daysInMonth ? 31 : smaller.day;
	*/
				myLarger.day = Math.min (myLarger.day, 30); mySmaller.day = Math.min (mySmaller.day, 30); // end of month is 30 for years-month reckoning
				if (myLarger.day >= mySmaller.day)	// did not suceed in destructuring affectation {dayDiff, withhold} = ...
					{ dayDiff = myLarger.day - mySmaller.day; withhold = 0 }
					else { dayDiff = myLarger.day - mySmaller.day + 30; withhold = 1 };
				if (myLarger.month >= mySmaller.month + withhold)
					{ monthDiff = myLarger.month - mySmaller.month - withhold; withhold = 0 } 
					else { monthDiff = myLarger.month - mySmaller.month - withhold + 12; withhold = 1};
				yearDiff = myLarger.year - mySmaller.year - withhold;
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek());
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case "auto"  : 
					case "days" : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw MilesianCalendar.invalidOption
				}
			}
		}
	}
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		this.updateRegister (date);
		let absYear = Math.abs(this.register.year);
		return  "[" + this.id + "] " 
			+ this.register.day + " " + this.register.month + "m " 
			+ ((this.register.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
		}
} // end of calendar object/class

class JulianCalendar  {
/**	Parameters for julian calendar variants
 * @param (number) weekStart : the day number of the first day of week, default 1 for Monday.
 * @param (number) w1Day : the day in the first month that is always in the week 1 of year, default 4 meaning 4 January.
*/
	constructor (id) {
		this.id = id;
		this.updateRegister (JulianCalendar.originDate); 	// Initiate register
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	fields (theFields) {	// For Temporal. add "era" if not seen
		let myFields = [...theFields];	// a brand new Array
		if (myFields.indexOf ("year") >= 0 && myFields.indexOf("era") == -1) myFields.unshift("era");
		return myFields;
	}
	eras = ["bc", "ad"]	// basic codes for eras should always be in small letters
	/* Basics data and computing options
	*/
	w1Day = 4	// the day number in January that characterises the first week
	static invalidOption = new RangeError ("unknown option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("date overflow with reject option") // thrown in case of overflow : reject option
	static mixingCalendar = new TypeError ("until or since operation requires same calendar")
	static originDate = Temporal.PlainDate.from ("0000-02-28") // This information could be inserted into params object
	julianClockwork = new Chronos ({ // To be used with day counter from Julian 0000-03-01 ie ISO 0000-02-28. Decompose into Julian years, months, date.
		timeepoch : 1721118, // Julian day of 1 martius 0 i.e. 0000-02-28
		coeff : [ 
		  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "relativeYear"}, // 4 Julian years
		  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "relativeYear"}, // One 365-days year
		  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "month"}, // Five-months cycle
		  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"}, // 61-days bimester
		  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "month"}, // 31-days month
		  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
		],
		canvas : [ 
			{name : "relativeYear", init : 0},	// relativeYear is a signed integer, 0 meaning 1 bc
			{name : "month", init : 3}, // Shifted year begins with month number 3 (March), thus simplify month shifting
			{name : "day", init : 1}
		]
		}, // end of calendRule
		{	// weekdayRule
			originWeekday: 1, 		// weekday of Julian Day 0 is Monday
			daysInYear: (year) => (Chronos.isJulianLeapYear( year ) ? 366 : 365),		// leap year rule for this calendar
			startOfWeek : 0,		// week start with 0 (Sunday)
			characWeekNumber : 1,	// we have a week 1 and the characteristic day for this week is 4 January. Little change with respect to ISO.
			dayBase : 1,			// use 1..7 display for weekday
			weekBase : 1,			// number of week begins with 1
			weekLength : 7			
		}
		) // end of new declaration
	/* Internal objects
	*/
	register = { // Register of properties, modified only if date in parameter is changed
		era : this.eras[0], year : 0, month : 0, day : 0, 		// fake initialisation to be changed by constructor
		relativeYear : 0, inLeapYear : false, dayOfWeek : 0, weekOfYear : 0, weeksInYear : 0, weekYearOffset : 0,
		index : 0		// day index
	}
	/** Compute an alternative year (relativeYear) and month fields if start of year is shifted later (positive shift) or earlier (negative shift) by "shift" months. (replace with shiftCycle).
		Used for Julian-Gregorian calendrical computations. 
			Shift (2, 0) replaces year 20 month 1 by year 19 month 13 and leaves year 20 month 6 unchanged.
			Shift (-2, 2) comes back from year 19 month 13 to year 20 month 1.
	 * @param {Object} dateFields: the set of original date fields, with .relativeYear and .month components.
	 * @param {number} shift: the number of month to be shifted, e.g. 2 is: new relativeYear in March instead of Januray
	 * @param (number) base: the months interval between standard new year and to-be-shifted, e.g. 2 if unshift from March to Januray is desired.
	 * @returns {Object} an object of same structure than dateFields, with "relativeYear" and "month" fields updated.
	*/
	shiftYearStart (dateFields, shift, base) { // Shift start of relativeYear to March, or back to January, for calendrical calculations
		let shiftedFields = {...dateFields};
		[ shiftedFields.relativeYear, shiftedFields.month ] = Chronos.shiftCycle (dateFields.relativeYear, dateFields.month, 12, shift, base + 1);
		return shiftedFields
	}
	relativeYear (era, year) {
		return era == this.eras[0] ? 1 - year : year
	}
	static internalDaysInMonth (month, isLeap) {
		return (month - Math.floor(month / 8)) % 2 == 1 
					? 31 
					: (month > 3 
						? 30 
						: isLeap ? 29 : 28 );
	}
	static dateFieldsOverflow (relativeYear, month, day) { // this field combination leads to overflow
		return  day < 1 || day > JulianCalendar.internalDaysInMonth(month, Chronos.isJulianLeapYear(relativeYear));
	}
	updateRegister (date) { // if date in parameter is different from last, update internal register to date given as a parameter.
		let index = JDConvert.toJulianDay (date.getISOFields());
		if (index !=  this.register.index) {
			this.register.index = index;			// date.withCalendar("iso8601").since(JulianCalendar.originDate).days;
			this.register = Object.assign ( this.register, this.shiftYearStart(this.julianClockwork.getObject (this.register.index),-2,2) );
			this.register.year = this.register.relativeYear;
			if (this.register.relativeYear > 0) this.register.era = this.eras[1]
				else {
				this.register.era = this.eras[0];
				this.register.year = 1 - this.register.relativeYear;
				};
			this.register.inLeapYear = Chronos.isJulianLeapYear ( this.register.relativeYear );
			// Week figures computations.
			let weekCharacFields = { relativeYear : this.register.relativeYear, month : 1, day : this.w1Day },
				weekCharacIndex = this.julianClockwork.getNumber(this.shiftYearStart(weekCharacFields,2,0));	// Day index of characteristic day
			[this.register.weekOfYear, this.register.dayOfWeek, this.register.weekYearOffset, this.register.weeksInYear] 
				= this.julianClockwork.getWeekFigures (this.register.index, weekCharacIndex, this.register.relativeYear);
			// dayOfYear
			let caractDayFields = { relativeYear : this.register.relativeYear, month : 1, day : 0};		// this is new year's eve.
			this.register.dayOfYear = this.register.index - this.julianClockwork.getNumber(this.shiftYearStart(caractDayFields,2,0));
		};
	}
	/* Main date and Temporal objects generator from fields representing a Julian date. 
	 Note that the Temporal.xxxDatexxx object shall be initiated with the ISO representation.
	*/ 
	dateFromFields (askedComponents, options, Construct=Temporal.PlainDate) { // options = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : askedComponents.day }; 
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		// check parameter values
		switch (options.overflow) {
			case undefined : options.overflow = "constrain"; 
			case "constrain" : case "balance" : case "reject" : break;
			default : throw JulianCalendar.invalidOption;
			}
		// check essential validity criteria. Note that user may either submit era and year, or submit year as a relative number, without era indication
		if (components.year <= 0 && components.era != null) throw JulianCalendar.outOfRangeDateElement; // year may be negative only if era is not specified
		if (components.month < 1 || components.month > 12) throw JulianCalendar.outOfRangeDateElement;
		// separate relative representation of years, compute date and save effective date fields
		switch (components.era) {
			case this.eras[0]: components.relativeYear = 1 - components.year; break; // translate to relative year counting 
			case this.eras[1]: components.relativeYear = components.year; break;
			case undefined: 
				components.relativeYear = components.year;
				[components.era, components.year] = components.relativeYear <= 0 ? [this.eras[0], 1 - components.relativeYear] : [this.eras[1], components.relativeYear];
				break;
			default : throw JulianCalendar.outOfRangeDateElement ;
			}
		// Check validity of day and solve overflow situation. Overflow correction (balance or constrain) is only possible on days.
		if (JulianCalendar.dateFieldsOverflow (components.relativeYear, components.month, components.day)) switch (options.overflow) {
			case "reject": throw JulianCalendar.dateOverflow;                                                  
			case "balance": break; // the standard algorithm balances day value
			case "constrain": 		// in this case recompute day part
				components.day = Math.max (components.day, 1);
				components.day = Math.min (components.day, JulianCalendar.internalDaysInMonth (components.month, Chronos.isJulianLeapYear (components.year)));
		}
		// All controls done, now translate fields into day-index from epoch, then compute IsoFields. Do not update register !
		let index = this.julianClockwork.getNumber(this.shiftYearStart(components,2,0)), // Translate Julian compound into julian Day...
			isoFields = JDConvert.toIsoFields (index);
		return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this); // standard return
	}
	yearMonthFromFields (askedComponents, askedOptions, Construct=Temporal.PlainYearMonth) {//askedOptions = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : 1 }; // set to the first day of month in Julian calendar
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		let myDate = this.dateFromFields(components, askedOptions);
		let myISOFields = myDate.getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myISOFields.isoYear, myISOFields.isoMonth, this, myISOFields.isoDay);
	}
	monthDayFromFields (askedComponents, askedOptions, Construct=Temporal.PlainMonthDay) { // askedOptions = {overflow : "constrain"}
		var components = { year : 2000, month : askedComponents.month, day : askedComponents.day }; 
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		let myDate = this.dateFromFields(components, askedOptions);
		let myISOFields = myDate.getISOFields();
		return new Construct(myISOFields.isoMonth, myISOFields.isoDay, this, myISOFields.isoYear);
	}
	/* Methods for Temporal.
	*/
	year (date) {
		this.updateRegister (date);
		return this.register.year;
		}
	month (date) {
		this.updateRegister (date);
		return this.register.month;
		}
	day (date) {
		this.updateRegister (date);
		return this.register.day;
		}
	era (date) { 
		this.updateRegister (date);
		return this.register.era 
		}
	dayOfWeek (date) {
		this.updateRegister (date);
		return this.register.dayOfWeek
	}
	dayOfYear (date) {
		this.updateRegister(date);
		return this.register.dayOfYear
	}
	weekOfYear (date) {	// Apply ISO 8601 rules to Julian calendar for week numbering
		this.updateRegister (date);
		return this.register.weekOfYear
	}
	daysInWeek (date) { return 7 }
	daysInMonth (date) {
		this.updateRegister(date);
		return JulianCalendar.internalDaysInMonth (this.register.month, this.register.inLeapYear)
	}
	daysInYear (date){
		return (this.inLeapYear(date) ? 366 : 365) // this.updateRegister(date) implied
	}
	monthsInYear (date) { return 12 }
	weeksInYear (date) { // This function is not yet foreseen in Temporal. How many weeks in this (week) year ? 52 or 53 ?
		this.updateRegister(date);
		return this.register.weeksInYear
	}
	weekYearOffset (date) {	// This function is not yet foreseen in Temporal. -1 : year corresponding to week number is preceding year, 0 same year, 1 following  year.
		this.updateRegister(date);
		return this.register.weekYearOffset;
	}
	inLeapYear (date) {
		this.updateRegister (date);
		return Chronos.isJulianLeapYear ( this.register.era == this.eras[0] ? 1-this.register.year : this.register.year )
		}
	/* Duration-connected methods. Read assumption hereunder.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options={overflow:"constrain"}, Construct) {// Add a +/- duration - 
		this.updateRegister(date);	// Translate date as of present calendar
		// 1. Build new date components from duration years and months
		let components = {...this.register}; 
		let addedYearMonth = Chronos.divmod ( this.register.month + duration.months - 1, 12 );
		components.relativeYear += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		components.year = components.relativeYear; delete components.era; // prepare to dateFromFields
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options, Construct); // stated options will do the job
		// 2. Add or subtract days to final result
		let resultFields = JDConvert.toIsoFields(JDConvert.toJulianDay(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options={largestUnit : "days"}) {  // name changed from "dateDifference"
		if (smaller.calendar.name != larger.calendar.name) throw JulianCalendar.mixingCalendar;
		switch (options.largestUnit) {
			case "years": case "months": case "weeks": case "days": break; // normally "weeks" should not be implemented
			default : throw JulianCalendar.invalidOption
		}
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { relativeYear : larger.calendar.relativeYear(larger.era, larger.year), month : larger.month, day : larger.day },
					mySmaller = { relativeYear : smaller.calendar.relativeYear(smaller.era, smaller.year), month : smaller.month, day : smaller.day },
					myDayOffset = this.julianClockwork.getNumber(myLarger) - this.julianClockwork.getNumber(mySmaller),
					myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
	/* 
	It could seem more logical to distinguish between 30 == last day of month, and 30 == not the last one
	In practical, better results are obtained by cutting all months to 30.
				myLarger.day = larger.day == larger.daysInMonth ? 31 : larger.day;	// For computation, all months finish on 30. Variant: on 31.
				mySmaller.day = smaller.day == smaller.daysInMonth ? 31 : smaller.day;
	*/
				myLarger.day = Math.min (myLarger.day, 30); mySmaller.day = Math.min (mySmaller.day, 30); // end of month is 30 for years-month reckoning
				if (myLarger.day >= mySmaller.day)	// did not suceed in destructuring affectation {dayDiff, withhold} = ...
					{ dayDiff = myLarger.day - mySmaller.day; withhold = 0 }
					else { dayDiff = myLarger.day - mySmaller.day + 30; withhold = 1 };
				if (myLarger.month >= mySmaller.month + withhold)
					{ monthDiff = myLarger.month - mySmaller.month - withhold; withhold = 0 } 
					else { monthDiff = myLarger.month - mySmaller.month - withhold + 12; withhold = 1};
				yearDiff = myLarger.relativeYear - mySmaller.relativeYear - withhold;
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek());
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case "auto"  :
					case "days"  : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw JulianCalendar.invalidOption
				}
			}
		}
	}
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		this.updateRegister (date);
		return  "[" + this.id + "] " + this.register.day + " " + this.register.month + " " 
				+ (this.register.year) + " " + this.register.era;
		}
} // end of calendar class

class WesternCalendar { // here try to use other Temporal tools rather than basic Chronos tools, whenever possible. // does not extend Temporal.Calendar
	constructor (id, switchingDate) {
		this.id = id;
		// this.switchingDateIndex = JulianDayIso.toJulianDay (switchingDate.getISOFields());
		this.switchingDate = Temporal.PlainDate.from(switchingDate).withCalendar("gregory");	//first date where Gregorien calendar is used
		this.switchingJD = JDConvert.toJulianDay(this.switchingDate.getISOFields());
		// if (this.switchingDateIndex < this.firstSwitchDateIndex)
		if (Temporal.PlainDate.compare (this.switchingDate, this.firstSwitchDate) == -1) 
			throw new RangeError ("Gregorian transition is on or after 1582-10-15");
		// this.register.index = 0;	// initialise register
		this.updateRegister (switchingDate); // will operate since initially declared date is ISO 0000-01-01
		this.lastJulianDate = Temporal.PlainDate.from(this.switchingDate).withCalendar(this.julianCalendar).subtract("P1D");
	}
	/* Basics for interaction with Temporal objects
	*/
	toString() {return this.id}	// necessary for subclasses, in order to get id passed as a parameter
	fields (theFields) {	// For Temporal. add "era" if not seen
		let myFields = [...theFields];	// a brand new Array
		if (myFields.indexOf ("year") >= 0 && myFields.indexOf("era") == -1) myFields.unshift("era");
		return myFields;
	}
	eras = ["bc", "as", "ns"]
	/* Calendar specific objects
	*/
	w1Day = 4	// the day number in January that characterises the first week
	static invalidOption = new RangeError ("unknown option")
	static unimplementedOption = new RangeError ("unimplemented option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("date overflow with reject option") // thrown in case of overflow : reject option
	static mixingCalendar = new TypeError ("until or since operation requires same calendar")
	static originDate = Temporal.PlainDate.from ("0000-03-01")	// 
	gregorianClockwork = new Chronos ({ // To be used with day counter from ISO 0000-03-01. Decompose into shifted Gregorian calendar years, months, date, and gives weeks
		timeepoch : 1721120, // Julian day of ISO 0000-03-01
		coeff : [ 
		  {cyclelength : 146097, ceiling : Infinity, subCycleShift : 0, multiplier : 400, target : "relativeYear"}, // 4 centuries
		  {cyclelength : 36524, ceiling :  3, subCycleShift : 0, multiplier : 100, target : "relativeYear"},		// one short century
		  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "relativeYear"}, // 4 Julian years
		  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "relativeYear"}, // One 365-days year
		  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "month"}, // Five-months cycle
		  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"}, // 61-days bimester
		  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "month"}, // 31-days month
		  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
		],
		canvas : [ 
			{name : "relativeYear", init : 0},	// relativeYear is a signed integer, 0 meaning 1 bc
			{name : "month", init : 3}, // Shifted year begins with month number 3 (March), thus simplify month shifting
			{name : "day", init : 1}
		]
		}, // end of calendRule
		{	// weekdayRule
			originWeekday: 1, 		// weekday of Julian Day 0 is Monday
			daysInYear: (year) => (Chronos.isGregorianLeapYear( year ) ? 366 : 365),		// leap year rule for this calendar
			startOfWeek : 1,		// week start with 1 (Monday)
			characWeekNumber : 1,	// we have a week 1 and the characteristic day for this week is 4 January.
			dayBase : 1,			// use 1..7 display for weekday
			weekBase : 1,			// number of week begins with 1
			weekLength : 7			
		}
	)
	/* Internal objects 
	*/
	firstSwitchDate = Temporal.PlainDate.from ("1582-10-15").withCalendar("gregory") // First date of A.S. or N.S. era
	registerDate = Temporal.PlainDate.from ("0000-01-01") // initiated with proleptic Gregorian origin, but changed by constructor.
	register = { era : "", year : 0, month : 0, day : 0 } // Initialise in constructor { era : this.eras[2], year : 1582, month : 10, day : 15 }
	julianCalendar = new JulianCalendar;
	updateRegister (date) { // if date in parameter is different from last, update internal registers to canonical date given in parameter.
		//let index = JulianDayIso.toJulianDay (getISOFields(date));
		//if (index !=  this.register.index) {
		if (Temporal.PlainDate.compare(date,this.registerDate) !=0) {
			// this.register.index = index;
			this.registerDate = Temporal.PlainDate.from (date).withCalendar("gregory");
			// if (index >= this.switchingDateIndex) {
			let index = JDConvert.toJulianDay (this.registerDate.getISOFields());
			if  (index >= this.switchingJD) {	// in Gregorian period //(Temporal.PlainDate.compare (date.withCalendar("gregory"), this.switchingDate) >= 0) does not work for equal dates !!
				Object.assign (this.register, this.registerDate.getFields()) ; 
				//let IsoFields = this.registerDate.getISOFields();
				//this.registerDate = new Temporal.PlainDate (IsoFields.isoYear, IsoFields.isoMonth, IsoFields.isoDay, this.gregorianCalendar);
				//Object.assign (this.register, this.registerDate.getFields());
				// delete this.register.calendar;	// avoid complications...
				this.register.era = this.eras[2];
				this.register.relativeYear = this.register.era == this.eras[0] ? 1 - this.register.year : this.register.year; // used for week computations
				// Week figures computations to reduce the small bug in week computing with "gregory"
				let weekCharacFields = { relativeYear : this.register.relativeYear, month : 1, day : this.w1Day }, // 4 of January
					weekCharacIndex = this.gregorianClockwork.getNumber(this.shiftYearStart(weekCharacFields,2,0));	// Day index of characteristic day
				[this.register.weekOfYear, this.register.dayOfWeek, this.register.weekYearOffset, this.register.weeksInYear] 
					= this.gregorianClockwork.getWeekFigures (index, weekCharacIndex, this.register.relativeYear);

				// this.register.dayOfWeek = this.registerDate.dayOfWeek;
				// this.register.weekOfYear = this.registerDate.weekOfYear; 
				this.register.dayOfYear = this.registerDate.dayOfYear;
				this.register.daysInMonth = this.registerDate.daysInMonth;
				this.register.daysInYear = this.registerDate.daysInYear
				} 
			else { // date components are Julian, declare "as" era in place of "ad" 
				Object.assign (this.register, this.registerDate.withCalendar(this.julianCalendar).getFields()); 
				//let IsoFields = this.registerDate.getISOFields();
				//this.registerDate = new Temporal.PlainDate (IsoFields.isoYear, IsoFields.isoMonth, IsoFields.isoDay, this.julianCalendar);
				//this.register = Object.assign (this.registerDate.getFields());
				if (this.register.era == this.julianCalendar.eras[1]) this.register.era = this.eras[1];
				this.register.dayOfWeek = this.registerDate.withCalendar(this.julianCalendar).dayOfWeek;
				this.register.weekOfYear = this.registerDate.withCalendar(this.julianCalendar).weekOfYear; 
				this.register.dayOfYear = this.registerDate.withCalendar(this.julianCalendar).dayOfYear;
				this.register.daysInMonth = this.registerDate.withCalendar(this.julianCalendar).daysInMonth;
				this.register.daysInYear = this.registerDate.withCalendar(this.julianCalendar).daysInYear;
				this.register.weekYearOffset = NaN; this.register.weeksInYear = NaN;	// These figures are not yet transmitted with the API, wash slots.
			}
			this.register.relativeYear = this.register.era == this.eras[0] ? 1 - this.register.year : this.register.year;
			// add other information in register
		}
	}
	shiftYearStart (dateFields, shift, base) { // Shift start of relativeYear to March, or back to January, for calendrical calculations
		let shiftedFields = {...dateFields};
		[ shiftedFields.relativeYear, shiftedFields.month ] = Chronos.shiftCycle (dateFields.relativeYear, dateFields.month, 12, shift, base + 1);
		return shiftedFields
	}
	relativeYear (era, year) {
		return era == this.eras[0] ? 1 - year : year
	}
	/* Date and Temporal objects generator from fields representing a date in the western historic calendar
	*/
	dateFromFields (askedComponents, options, Construct=Temporal.PlainDate) { //options = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : askedComponents.day }, testDate; 
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		// check parameter values
		switch (options.overflow) { // balance value is not implemented
			case undefined : options.overflow = "constrain";  break;
			case "balance" : case "constrain" : case "reject" : break;
			default : throw WesternCalendar.invalidOption;
			}
		// if (! Number.isInteger(components.year) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) throw ...;
		if (components.year <= 0 && components.era != null) throw WesternCalendar.outOfRangeDateElement; 
		switch (components.era) {
			case this.julianCalendar.eras[1]: delete components.era ; // here user does not tell much about date, it is like undefined.
			case this.eras[0]: case this.eras[1]: case this.eras[2]: case undefined: break;
			default : throw WesternCalendar.outOfRangeDateElement;
			}
		if (components.month < 1 || components.month > 12) throw WesternCalendar.outOfRangeDateElement;
		if (components.day < 1) throw WesternCalendar.outOfRangeDateElement;
		/*	
		If era is unspecified, first compare the Gregorian presentation to the switching date. 
		If era specified, the caller knows what he wants, date is analysed following era indication, but result is aligned with present calendar.
		If after, confirm "ns". If before, mark "as"; "bc"  MUST be specified, negative years are rejected.
		If era is specified, "as"/"ns", analysis is guided by era specified, 
		Range error is thrown for any "ns" date before 1582-10-15.
		*/	
		// delete components.calendar;		// to avoid attemp to construct a wrong date - not all is implemented

		if (components.era == undefined) {	// era not user-defined, Gregorian transition date assumed
			testDate = Temporal.PlainDate.from (components); // Date.Calendar.dateFromFields was prefered. Here "balance" is not available, hence no control
			if (Temporal.PlainDate.compare (testDate.withCalendar("gregory"), this.switchingDate) >= 0) {// on or after transition date
				components.calendar = "gregory";
				testDate = Temporal.PlainDate.from (components,options);		// Create new object, obtain reject if required.
				Object.assign (components, testDate.getFields());
				// delete components.calendar;	// avoid complications
				components.era = this.eras[2];
				// this.register = this.registerDate.with({calendar : "gregory"}).getFields(); ???
			} else { // Date without expressed era is before transition date
				// components.era = this.julianCalendar.eras[1];  //for Julian calendar analysis
				components.calendar = this.julianCalendar;
				testDate = this.julianCalendar.dateFromFields (components, options);
				// components = testDate.with({calendar : this.julianCalendar}).getFields(); 
				if (components.era == this.julianCalendar.eras[1]) components.era = this.eras[1]; 
			}
		}
		else // here the follow user's "bc", "as" or "ns" indication; "ad" is considered like undefined.
			if (components.era == this.eras[2]) {
				components.calendar = "gregory";
				testDate = Temporal.PlainDate.from (components, options);
				if (Temporal.PlainDate.compare (testDate.withCalendar("gregory"), this.firstSwitchDate) < 0) throw WesternCalendar.invalidEra;
				// components = testDate.with({calendar : "gregory"}).getFields(); // this.register 
				components.era = this.eras[2];
			}
			else {
				let savera = components.era;	
				if (components.era == this.eras[1]) components.era = this.julianCalendar.eras[1];	// "as" is rejected with the plain julian calendar.
				components.calendar = this.julianCalendar;
				testDate = this.julianCalendar.dateFromFields (components, options);
				// components = testDate.with({calendar : this.julianCalendar}).getFields(); // this.register 
				components.era = savera; // retrieve "as" if neededq
			}
	/* finalise: store real date and effective components */	
		this.updateRegister (testDate); // the absolute date and the canonical presentation from testDate

	/* Overflow situation was detected during Julian or Gregorian analysis. Test final situation */
		let overflow = // any difference between source and target, due to "constrain" application, or to bad choice of era
			(components.era != undefined && components.era != this.register.era)
			|| components.year != this.register.year 
			|| components.month != this.register.month
			|| components.day != this.register.day ;
		if (overflow && options.overflow == "reject") throw WesternCalendar.dateOverflow;
		let isoFields = this.registerDate.getISOFields();
		return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this)//this.registerDate.withCalendar(this);
		}
	yearMonthFromFields (askedComponents, askedOptions, Construct=Temporal.PlainYearMonth) {// askedOptions = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : 1 }; // set to the first day of month in Julian calendar
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		let myDate = this.dateFromFields(components, askedOptions);
		let myISOFields = myDate.getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myISOFields.isoYear, myISOFields.isoMonth, this, myISOFields.isoDay);
	}
	monthDayFromFields (askedComponents, askedOptions, Construct=Temporal.PlainMonthDay) { // askedOptions = {overflow : "constrain"}
		var components = { year : 2000, month : askedComponents.month, day : askedComponents.day }; 
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		let myDate = this.dateFromFields(components, askedOptions);
		let myISOFields = myDate.getISOFields();
		return new Construct(myISOFields.isoMonth, myISOFields.isoDay, this, myISOFields.isoYear);
	}
	/* Standard methods. Here the fields results strictly from the calendar's rule
	*/
	era (date) { 
		this.updateRegister (date);
		return this.register.era 
		}
	year (date) {
		this.updateRegister (date);
		return this.register.year;
		}
	month (date) {
		this.updateRegister (date);
		return this.register.month;
		}
	day (date) {
		this.updateRegister (date);
		return this.register.day;
		}
	daysInWeek (date) {
		this.updateRegister (date);
		return 7;
	}
	dayOfWeek (date) {
		this.updateRegister (date);
		return this.register.dayOfWeek
	}
	weekOfYear (date) {
		this.updateRegister (date);
		return this.register.weekOfYear
	}
	dayOfYear (date) {
		this.updateRegister (date);
		return this.register.dayOfYear
	}
	daysInMonth (date) {
		this.updateRegister (date);
		return this.register.daysInMonth
	}
	daysInYear (date) {
		this.updateRegister (date);
		return this.register.daysInYear
	}
	inLeapYear (date) { // a same year, like 1700 for a switching date that year, may be leap at the begining, then common.
		this.updateRegister (date);
		let y = this.register.year;
		// let e = , y = (e == this.eras[0] ? 1 - this.register.year : this.register.year) ;
		switch (this.register.era) {
			case this.eras[0] : y = 1 - this.register.year;	// set y as a relative counter and continue
			case this.eras[1] : return Chronos.isJulianLeapYear(y); 
			case this.eras[2] : return Chronos.isGregorianLeapYear(y); ;
		}
	}
	/* Duration-connected methods
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options, Construct) {// Add a +/- duration - //options={overflow:"constrain"}
		this.updateRegister(date);
		let components = {...this.register}; 
		let addedYearMonth = Chronos.divmod ( this.register.month + duration.months - 1, 12 );
		components.relativeYear += (duration.years + addedYearMonth[0]); 
		components.year = components.relativeYear; delete components.era;
		components.month = addedYearMonth[1] + 1; 
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options, Construct); // stated options will do the job. 
		// However, the case of "blackout" period may be not considered. Here the decision is to constrain day to the last of Julian epoch
		components.calendar = "gregory";
		let dateOneJD = JDConvert.toJulianDay(dateOne.getISOFields()), 
			componentsGregoryJD = JDConvert.toJulianDay (Temporal.PlainDate.from (components).getISOFields());
		if (dateOneJD >= this.switchingJD && componentsGregoryJD < this.switchingJD)		// case where the date computed by adding years and months fall in the blackout dates range
			switch (options.overflow) {
				case "reject" : throw WesternCalendar.dateOverflow ;
				case "constrain" : dateOne = Temporal.PlainDate.from(this.lastJulianDate);
			};
		// Finally add or subtract days to final result
		let resultFields = JDConvert.toIsoFields(JDConvert.toJulianDay(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options) {  // name changed from "dateDifference" //options={largestUnit : "days"}
		if (smaller.calendar.name != larger.calendar.name) throw WesternCalendar.mixingCalendar;
		switch (options.largestUnit) {
			case "years": case "months": case "weeks": case "days": break; // normally "weeks" should not be implemented
			default : throw WesternCalendar.invalidOption
		}
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { relativeYear : larger.calendar.relativeYear(larger.era, larger.year), month : larger.month, day : larger.day },
					mySmaller = { relativeYear : smaller.calendar.relativeYear(smaller.era, smaller.year), month : smaller.month, day : smaller.day },
					myDayOffset = JDConvert.toJulianDay(larger.getISOFields()) - JDConvert.toJulianDay(smaller.getISOFields()),
					myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
	/* 
	It could seem more logical to distinguish between 30 == last day of month, and 30 == not the last one
	In practical, better results are obtained by cutting all months to 30, except of course if February is one of the dates.
				myLarger.day = larger.day == larger.daysInMonth ? 31 : larger.day;	// For computation, all months finish on 30. Variant: on 31.
				mySmaller.day = smaller.day == smaller.daysInMonth ? 31 : smaller.day;
	*/
				myLarger.day = Math.min (myLarger.day, 30); mySmaller.day = Math.min (mySmaller.day, 30); // end of month is 30 for years-month reckoning
				if (myLarger.day >= mySmaller.day)	// did not suceed in destructuring affectation {dayDiff, withhold} = ...
					{ dayDiff = myLarger.day - mySmaller.day; withhold = 0 }
					else { dayDiff = myLarger.day - mySmaller.day + 30; withhold = 1 };
				if (myLarger.month >= mySmaller.month + withhold)
					{ monthDiff = myLarger.month - mySmaller.month - withhold; withhold = 0 } 
					else { monthDiff = myLarger.month - mySmaller.month - withhold + 12; withhold = 1};
				yearDiff = myLarger.relativeYear - mySmaller.relativeYear - withhold;
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek());
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case "days"  : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw WesternCalendar.invalidOption
				}
			}
		}
	}
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		this.updateRegister (date);
		return "[" + this.id + "] " + this.register.day + " " + this.register.month + " " 
			+ (this.register.year) + " " + this.register.era 
	}
}// end of calendar class

const
	milesian = new MilesianCalendar ("milesian"),
	julian = new JulianCalendar ("julian"),
	vatican = new WesternCalendar ("vatican","1582-10-15"),
	french = new WesternCalendar ("french","1582-12-20"),
	german = new WesternCalendar ("german","1700-03-01"),
	english = new WesternCalendar("english","1752-09-14");

