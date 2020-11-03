/* Western (Julian-Gregorian) calendar as Temporal sub-class of ISO8601
	Character set is UTF-8
	The Julian-Gregorioan calendar as a Temporal.Calendar sub-class, contructed with the day of transition to Gregorian
	3 eras with this calendar:
		0. B.C.
		1. A.S. i.e. Anno Domini, and ancient style, using the Julian calendar, from 0000-12-30 to at least 1582-10-15, or later if wished.
		2. N.S. New style, must be after 1582-10-15 (else use directly iso8601).
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
/* Version	M2020-11-13 - eras in lowercase
	M2020-10-19 original
	Source: since 2017
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
/*
 1. Class declaration for a western calendar. The transition to Gregorian date and a name shall be given. Reference to iso8601.
*/
class WesternCalendar extends Temporal.Calendar { // here try to use other Temporal tools rather than basic Chronos tools, whenever possible.
	constructor (switchingDate, name) {
		super ("iso8601");
		this.name = name;
		// this.switchingDateIndex = JulianDayIso.toJulianDay (switchingDate.getISOFields());
		this.switchingDate = Temporal.Date.from(switchingDate);	//first date where Gregorien calendar is used
		// if (this.switchingDateIndex < this.firstSwitchDateIndex)
		if (Temporal.Date.compare (this.switchingDate, this.firstSwitchDate) == -1) 
			throw new RangeError ("Gregorian transition is on or after 1582-10-15");
		// this.register.index = 0;	// initialise register
		this.updateRegister (switchingDate); // will operate since initially declared date is ISO 0000-01-01
	}
	/* Basics
	*/
	static invalidOption = new RangeError ("unknown option")
	static unimplementedOption = new RangeError ("unimplemented option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("date overflow with reject option") // thrown in case of overflow : reject option
	eras = ["bc", "as", "ns"]
	// firstSwitchDateIndex = 2299161 
	firstSwitchDate = Temporal.Date.from ("1582-10-15") // First date of A.S. or N.S. era
	registerDate = Temporal.Date.from ("0000-01-01") // initiated with proleptic Gregorian origin, but changed by constructor.
	register = { era : "", year : 0, month : 0, day : 0 } // Initialise in constructor { era : this.eras[2], year : 1582, month : 10, day : 15 }
	julianCalendar = new JulianCalendar
	// gregorianCalendar = new Temporal.Calendar("iso8601") // if we declare a new calendar, we have to explain everything about it !!
	updateRegister (date) { // if date in parameter is different from last, update internal registers to canonical date given in parameter.
		//let index = JulianDayIso.toJulianDay (getISOFields(date));
		//if (index !=  this.register.index) {
		if (Temporal.Date.compare(date,this.registerDate) !=0) {
			// this.register.index = index;
			this.registerDate = Temporal.Date.from (date);
			// if (index >= this.switchingDateIndex) {
			if (Temporal.Date.compare (date, this.switchingDate) >= 0) {// in Gregorian period
				Object.assign (this.register, this.registerDate.withCalendar("iso8601").getFields()) ; 
				//let IsoFields = this.registerDate.getISOFields();
				//this.registerDate = new Temporal.Date (IsoFields.isoYear, IsoFields.isoMonth, IsoFields.isoDay, this.gregorianCalendar);
				//Object.assign (this.register, this.registerDate.getFields());
				this.register.era = this.eras[2];
				// delete this.register.calendar;	// avoid complications...
				} 
			else { // date components are Julian, declare "as" era in place of "ad" 
				Object.assign (this.register, this.registerDate.withCalendar(this.julianCalendar).getFields()); 
				//let IsoFields = this.registerDate.getISOFields();
				//this.registerDate = new Temporal.Date (IsoFields.isoYear, IsoFields.isoMonth, IsoFields.isoDay, this.julianCalendar);
				//this.register = Object.assign (this.registerDate.getFields());
				if (this.register.era == this.julianCalendar.eras[1]) this.register.era = this.eras[1];
			}
			// add other information in register
		}
	}
	/* Standard methods. Here the fields results strictly from the calendar's rule
	*/
	fields (theFields) {	// For Temporal. add "era" if not seen
		let myFields = [...theFields];	// a brand new Array
		if (myFields.indexOf ("year") >= 0 && myFields.indexOf("era") == -1) myFields.unshift("era");
		return myFields;
	}
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
	dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) { 
		var components = { ...askedComponents}, options = {...askedOptions}, testDate;
		// check parameter values
		switch (options.overflow) { // balance value is not implemented
			case undefined : options.overflow = "constrain";  break;
			case "balance" : throw WesternCalendar.unimplementedOption; break;
			case "constrain" : case "reject" : break;
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
			testDate = Temporal.Date.from (components); // Date.Calendar.dateFromFields was prefered. Here "balance" is not available, hence no control
			if (Temporal.Date.compare (testDate, this.switchingDate) >= 0) {// on or after transition date
				components.calendar = "iso8601";
				testDate = Temporal.Date.from (components,options);		// Create new object, obtain reject if required.
				Object.assign (components, testDate.getFields());
				// delete components.calendar;	// avoid complications
				components.era = this.eras[2];
				// this.register = this.registerDate.with({calendar : "iso8601"}).getFields(); ???
			} else { // Date without expressed era is before transition date
				// components.era = this.julianCalendar.eras[1];  //for Julian calendar analysis
				components.calendar = this.julianCalendar;
				testDate = this.julianCalendar.dateFromFields (components, options);
				// components = testDate.with({calendar : this.julianCalendar}).getFields(); 
				if (components.era == this.julianCalendar.eras[1]) components.era = this.eras[1]; 
			}
		}
		else // here the follow user's B.C., A.S. or N.S. indication; A.D. is considered like undefined.
			if (components.era == this.eras[2]) {
				components.calendar = "iso8601";
				testDate = Temporal.Date.from (components, options);
				if (Temporal.Date.compare (testDate, this.firstSwitchDate) < 0) throw WesternCalendar.invalidEra;
				// components = testDate.with({calendar : "iso8601"}).getFields(); // this.register 
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
	toDateString (date) { // non standard
		this.updateRegister (date);
		return "[" + this.name + "]" + this.register.day + "." + this.register.month + "." 
			+ (this.register.year) + " " + this.register.era 
	}
}// end of calendar class