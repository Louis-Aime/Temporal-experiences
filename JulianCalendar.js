/* Julian calendar class as Temporal sub-class of ISO8601
	Character set is UTF-8
Required
	Package Chronos
	TemporalEnvironment: define monthBase and Julian Day computations
Contents: 
	JulianCalendar: an object (a variable, maybe later a class, with the property / method corresponding to the projected Temporal.Calendar canvas
	method toDateString is added - just to facilitate control.
Comments: JSDocs comments to be added.
*/
/* Version	M2020-11-23 - New names in Temporal. Replace monthBase with 1.
	M2020-11-14-2 - Modify access to parameters of dateFromFields, yearMonthFromFields, monthDayFromFields
	M2020-11-14 - improve and simplify dateAdd
	M2020-11-13-2 use Chronos week handler, refer to "gregory", restructure comments
	M2020-11-13 - eras changed to lowercase characters
	M2020-11-12 - Common version of Chronos
	M2020-10-19 original
	Source: since 2017
*/
/* Required
	Package Chronos
	A file with dateEnvironment; an object with monthBase (0 or 1) and Julian Day computations
*/
/* Copyright Miletus 2016-2020 - Louis A. de FOUQUIERES
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
class JulianCalendar extends Temporal.Calendar { // with "name"
/**	Parameters for julian calendar variants
 * @param (number) weekStart : the day number of the first day of week, default 1 for Monday.
 * @param (number) w1Day : the day in the first month that is always in the week 1 of year, default 4 meaning 4 January.
*/
	constructor (name) {
		super ("gregory");
		this.name = name;
		//this.weekStart = weekStart == undefined ? 1 : weekStart;
		//this.w1Day = w1Day == undefined ? 4 : w1Day;
		this.updateRegister (JulianCalendar.originDate); 	// Initiate register
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
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
	dateSubtract (date, duration, options, Construct) {
		//let myDuration = duration.negated();		// "duration.negated is not a function ???" necessary to construct new object. Because duration may be a "Duration like"
		let myDuration = Temporal.Duration.from(duration).negated();
		return this.dateAdd(date, myDuration, options, Construct) 
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
		return  "[" + this.name + "]" + this.register.day + "." + this.register.month + "." 
				+ (this.register.year) + " " + this.register.era; 
		}
} // end of calendar class