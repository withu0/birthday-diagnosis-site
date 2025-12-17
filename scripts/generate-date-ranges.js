/**
 * Script to generate date range groups with Google Sheets row numbers
 * 
 * Groups dates into 5-year periods:
 * - 1899-1904 (1899/12/31 to 1904/12/31)
 * - 1905-1909 (1905/1/1 to 1909/12/31)
 * - etc.
 * 
 * Data starts at row 22 in Google Sheets (C22)
 * Dates span from 1899/12/31 to 2031/12/31
 */

const fs = require('fs');
const path = require('path');

const formatDate = (date) => {
  // Use UTC to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}/${month}/${day}`;
};

const createDate = (year, month, day) => {
  // Create date in UTC to avoid timezone issues
  return new Date(Date.UTC(year, month - 1, day));
};

const calculateDaysBetween = (start, end) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round((end.getTime() - start.getTime()) / oneDay);
};

const generateDateRanges = () => {
  const START_DATE = createDate(1899, 12, 31);
  const END_DATE = createDate(2031, 12, 31);
  const START_ROW = 22; // Data starts at row 22 (C22)
  
  const groups = [];
  
  // First group: 1899-1904
  // Start: 1899/12/31
  // End: 1904/12/31
  const firstGroupStart = createDate(1899, 12, 31);
  const firstGroupEnd = createDate(1904, 12, 31);
  const firstGroupRowCount = calculateDaysBetween(firstGroupStart, firstGroupEnd) + 1;
  
  groups.push({
    groupId: '1899-1904',
    startYear: 1899,
    endYear: 1904,
    startDate: formatDate(firstGroupStart),
    endDate: formatDate(firstGroupEnd),
    startRow: START_ROW,
    endRow: START_ROW + firstGroupRowCount - 1,
    rowCount: firstGroupRowCount
  });
  
  let nextRow = START_ROW + firstGroupRowCount;
  
  // Generate remaining groups: 1905-1909, 1910-1914, ..., 2025-2029, 2030-2031
  for (let startYear = 1905; startYear <= 2031; startYear += 5) {
    const groupStartYear = startYear;
    const groupEndYear = Math.min(startYear + 4, 2031);
    
    const groupStartDate = createDate(groupStartYear, 1, 1);
    const groupEndDate = createDate(groupEndYear, 12, 31);
    
    // Ensure we don't go beyond the end date
    if (groupStartDate > END_DATE) break;
    if (groupEndDate > END_DATE) {
      groupEndDate.setTime(END_DATE.getTime());
    }
    
    const rowCount = calculateDaysBetween(groupStartDate, groupEndDate) + 1;
    
    groups.push({
      groupId: `${groupStartYear}-${groupEndYear}`,
      startYear: groupStartYear,
      endYear: groupEndYear,
      startDate: formatDate(groupStartDate),
      endDate: formatDate(groupEndDate),
      startRow: nextRow,
      endRow: nextRow + rowCount - 1,
      rowCount: rowCount
    });
    
    nextRow += rowCount;
  }
  
  return groups;
};

const main = () => {
  console.log('Generating date range groups...\n');
  
  const groups = generateDateRanges();
  
  // Output summary
  console.log(`Generated ${groups.length} date range groups:\n`);
  groups.forEach(group => {
    console.log(`${group.groupId}: ${group.startDate} to ${group.endDate}`);
    console.log(`  Rows: ${group.startRow} to ${group.endRow} (${group.rowCount} rows)`);
    console.log('');
  });
  
  // Calculate total rows
  const totalRows = groups.reduce((sum, group) => sum + group.rowCount, 0);
  const expectedRows = 48234 - 22 + 1; // From row 22 to 48234
  console.log(`Total rows: ${totalRows}`);
  console.log(`Expected rows: ${expectedRows}`);
  console.log(`Difference: ${Math.abs(totalRows - expectedRows)}\n`);
  
  // Output JSON
  const output = {
    metadata: {
      description: 'Date range groups for Google Sheets optimization',
      dataStartRow: 22,
      dataEndRow: 48234,
      dateRange: {
        start: '1899/12/31',
        end: '2031/12/31'
      },
      groupSize: 5, // years
      generatedAt: new Date().toISOString()
    },
    groups: groups
  };
  
  // Write to file
  const outputPath = path.join(__dirname, '../date-range-groups.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\nJSON file written to: ${outputPath}`);
  console.log('\nFirst group sample:');
  console.log(JSON.stringify(groups[0], null, 2));
  console.log('\nLast group sample:');
  console.log(JSON.stringify(groups[groups.length - 1], null, 2));
};

main();

module.exports = { generateDateRanges };

