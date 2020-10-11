# Temporal-experiences
Applications using the draft Temporal environment

Some use cases of the draft Temporal environement, in particular Temporal.Calendar.

## File contents
The .js files consists in 4 classes. 
* CBCCE is a "Cycle Based Calendar Computation Engine" used by the other classes.
* MilesianCalendar extends TemporalCalendar. It is a very simple solar calendar. 
Years comprise 12 months of 30 or 31 days alternatively. 
Years begin on 12-21 just before common years, or 12-22 just before leap years
of the iso8601 calendar.
* JulianCalendar extends TemporalCalendar. The plain Julian calendar as used in Europe
until 1582. Two eras: B.C. and A.D. (default).
* WesternCalendar extends TemporalCalendar. Instantiate with 
    * the date string of the transition to Gregorian,
    * a name for future use.
The HTML files collects the Temporal environment.

## Usage
Use the web console.
Exemple: 
```
wcal = new WesternCalendar("1700-03-01", "Germany")
options = {overflow : "constrain"}
tsRecord = {year : 1700, month : 2, day : 28, era : "N.S."}
wdate = wcal.dateFromFields(tsRecord, options)
wcal.toDateString(wdate)
```
You may try with era to "A.S.", or suppress it; Try suppressing the `options`.
Check that 1700 in protestant Germany was a leap year until February, but a common year in March and after.
You may try B.C. years.

As of 2020-10-12: 
* All expectped methods are implemented in MilesianCalendar class
* In JulianCalendar and WesternCalendar, only Fields getter and initializers are implemented.

ready-to-use environment: https://louis-de-fouquieres.pagesperso-orange.fr/Temporal/TemporalTries.html
