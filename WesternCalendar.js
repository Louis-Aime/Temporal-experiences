/* Western (Julian-Gregorian) calendar as Temporal sub-class of gregory
	Character set is UTF-8
	The Julian-Gregorioan calendar as a Temporal.Calendar sub-class, contructed with the day of transition to Gregorian
	3 eras with this calendar:
		0. B.C.
		1. A.S. i.e. Anno Domini, and ancient style, using the Julian calendar, from 0000-12-30 to at least 1582-10-15, or later if wished.
		2. N.S. New style, must be after 1582-10-15 (else use directly gregory).
	A date for the Gregorian transition is given with the calendar instatiation. 
	Date conversion from the external world, or fields conversion without expressing the era, use this transition date.
	Valid date object may be built overlaping the transition date but any N.S. date before 1582-10-15 shall be converted to A.S.
	A.D. is always converted to A.S.
Required
	?? Package Chronos -> the general calendar computation engine.
	JulianCalendar
Contents: 
	JulianCalendar: an object (a variable, maybe later a class, with the property / method corresponding to the projected Temporal.Calendar canvas
	method toDateString is added - just to facilitate control.
Comments: JSDocs comments to be added.
*/
/* Version	M2020-11-23 - New names in Temporal, replace monthBase with 1.
	M2020-11-14-2 - Modify access to parameters of dateFromFields, yearMonthFromFields, monthDayFromFields
	M2020-11-14 - all methods implemented
	M2020-11-13-3 - refer to gregory. Many methods are still missing.
	M2020-11-13-2 - add getters. Add, subtract, difference, still  missing.
	M2020-11-13 - eras in lowercase
	M2020-10-19 original
	Source: since 2017
*/
/* Required
	Package Chronos
	A file with dateEnvironment; an object with monthBase (0 or 1) and Julian Day computations
	JulianCalendar
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
class WesternCalendar extends Temporal.Calendar { // here try to use other Temporal tools rather than basic Chronos tools, whenever possible.
	constructor (switchingDate, name) {
		super ("gregory");
		this.name = name;
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
	dateSubtract (date, duration, options, Construct) {
		//let myDuration = duration.negated();		// "duration.negated is not a function ???" necessary to construct new object. Because duration may be a "Duration like"
		let myDuration = Temporal.Duration.from(duration).negated();
		return this.dateAdd(date, myDuration, options, Construct) 
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
		return "[" + this.name + "]" + this.register.day + "." + this.register.month + "." 
			+ (this.register.year) + " " + this.register.era 
	}
}// end of calendar class