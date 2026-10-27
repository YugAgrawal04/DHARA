// =====================================================================
// AQI calculation (US EPA style breakpoints, linear interpolation)
// =====================================================================

export const AQI_BREAKPOINTS = {
    pm2_5: [
        { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50 },
        { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
        { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
        { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
    ],
    pm10: [
        { cLow: 0,   cHigh: 54,  iLow: 0,   iHigh: 50 },
        { cLow: 55,  cHigh: 154, iLow: 51,  iHigh: 100 },
        { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
        { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
        { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
        { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
    ],
    co: [
        { cLow: 0.0,   cHigh: 4400,  iLow: 0,   iHigh: 50 },
        { cLow: 4500,  cHigh: 9400,  iLow: 51,  iHigh: 100 },
        { cLow: 9500,  cHigh: 12400, iLow: 101, iHigh: 150 },
        { cLow: 12500, cHigh: 15400, iLow: 151, iHigh: 200 },
        { cLow: 15500, cHigh: 30400, iLow: 201, iHigh: 300 },
        { cLow: 30500, cHigh: 50400, iLow: 301, iHigh: 500 },
    ],
    no2: [
        { cLow: 0,    cHigh: 53,   iLow: 0,   iHigh: 50 },
        { cLow: 54,   cHigh: 100,  iLow: 51,  iHigh: 100 },
        { cLow: 101,  cHigh: 360,  iLow: 101, iHigh: 150 },
        { cLow: 361,  cHigh: 649,  iLow: 151, iHigh: 200 },
        { cLow: 650,  cHigh: 1249, iLow: 201, iHigh: 300 },
        { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
    ],
};

export const AQI_CATEGORIES = [
    { min: 0,   max: 50,  label: 'Good',                    short: 'Good',           color: '#10b981', description: 'Air quality is satisfactory' },
    { min: 51,  max: 100, label: 'Moderate',                short: 'Moderate',       color: '#f59e0b', description: 'Acceptable for most people' },
    { min: 101, max: 150, label: 'Unhealthy for Sensitive', short: 'Sensitive',      color: '#fb923c', description: 'Sensitive groups may be affected' },
    { min: 151, max: 200, label: 'Unhealthy',               short: 'Unhealthy',      color: '#ef4444', description: 'Everyone may experience effects' },
    { min: 201, max: 300, label: 'Very Unhealthy',          short: 'Very Unhealthy', color: '#dc2626', description: 'Health alert: everyone may experience serious effects' },
    { min: 301, max: 500, label: 'Hazardous',               short: 'Hazardous',      color: '#991b1b', description: 'Emergency conditions: entire population affected' },
];

export function calculateAQI(pollutant, concentration) {
    const breakpoints = AQI_BREAKPOINTS[pollutant];
    if (!breakpoints) return 0;
    for (const bp of breakpoints) {
        if (concentration >= bp.cLow && concentration <= bp.cHigh) {
            return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow);
        }
    }
    return concentration > breakpoints[breakpoints.length - 1].cHigh ? 500 : 0;
}

/** Overall AQI = worst individual pollutant AQI. */
export function getOverallAQI(data) {
    const individual = {
        pm2_5: calculateAQI('pm2_5', data.pm2_5),
        pm10:  calculateAQI('pm10',  data.pm10),
        co:    calculateAQI('co',    data.co),
        no2:   calculateAQI('no2',   data.no2),
    };
    const value = Math.max(...Object.values(individual));
    const category = AQI_CATEGORIES.find(c => value >= c.min && value <= c.max)
        || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];

    return {
        value,
        category: category.label,
        color: category.color,
        description: category.description,
        dominantPollutant: Object.keys(individual).find(k => individual[k] === value),
        individual,
    };
}
