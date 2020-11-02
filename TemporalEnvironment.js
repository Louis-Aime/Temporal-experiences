/* Date environment: if legacy Date, monthbase is 0. If Temporal, monthbase is 1. Define also isoJD.
*/
const dateEnvironment = {
	monthBase : 1,
	isoJD : new JulianDayIso(1)	// Construction using monthBase == 0, i.e. number of first month in year is 0
}