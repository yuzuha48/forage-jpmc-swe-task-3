import { ServerRespond } from './DataStreamer';


// Determine the variables and their types
export interface Row {
  price_abc: number, 
  price_def: number, 
  ratio: number, 
  timestamp: Date, 
  upper_bound: number, 
  lower_bound: number, 
  trigger_alert: number | undefined,
}

// Store all of the ratios and timestamps
let historicalData: {ratio: number; timestamp: Date}[] = [];

export class DataManipulator {

  static generateRow(serverResponds: ServerRespond[]): Row {
    // Get the stock prices by getting the average of the top ask and top bid prices (first element in serverResponds is stock ABC & second element is stock DEF)
    const priceABC = (serverResponds[0].top_ask.price + serverResponds[0].top_bid.price) / 2; 
    const priceDEF = (serverResponds[1].top_ask.price + serverResponds[1].top_bid.price) / 2;
    const ratio = priceABC / priceDEF;
    // The timestamp is the later time of the two stock's timestamps
    const timestamp = serverResponds[0].timestamp > serverResponds[1].timestamp ? 
    serverResponds[0].timestamp : serverResponds[1].timestamp

    // Add ratios and timestamps to historicalData
    historicalData.push({ratio: ratio, timestamp: timestamp});
    // Get the month from 12 months ago 
    const twelveMonthsAgo = new Date(timestamp); 
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Filter historicalData by ratios from the last 12 months 
    const relevantData = historicalData.filter(
      (row) => new Date(row.timestamp) > twelveMonthsAgo
    );
    // Add up the ratios in relevantData and divide by the count of ratios to get the average
    const averageRatio = relevantData.reduce((sum, row) => sum + row.ratio, 0) / relevantData.length;
    
    // Set upper and lower bounds to by +/- 10% of the 12-month historical average ratio 
    const upperBound = averageRatio + 0.10;
    const lowerBound = averageRatio - 0.10;

    return {
      price_abc: priceABC, 
      price_def: priceDEF, 
      ratio, 
      timestamp: timestamp,
      upper_bound: upperBound,
      lower_bound: lowerBound, 
      // Set the value of trigger alert to whatever the ratio is when a bound is passed; otherwise, the value is undefined
      trigger_alert: (ratio > upperBound || ratio < lowerBound) ? ratio : undefined,
    };
  }
}
