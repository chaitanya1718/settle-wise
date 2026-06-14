const csv = require("csv-parser");
const fs = require("fs");

/**
 * Parses a CSV file and returns an array of row objects.
 * Normalizes headers to lowercase and trims whitespace.
 * 
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Promise<Array<object>>} - Promise resolving to an array of row records
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim()
        })
      )
      .on("data", (data) => {
        // Trim values inside each row
        const cleanedRow = {};
        for (const [key, value] of Object.entries(data)) {
          cleanedRow[key] = typeof value === "string" ? value.trim() : value;
        }
        results.push(cleanedRow);
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

module.exports = {
  parseCSV
};
