const fs = require("fs");
const HOTELS_TYPES_DATA_DIR = "/mnt/hotels/types";
const formatted: any = {};
const facilities = JSON.parse(
  fs.readFileSync(`${HOTELS_TYPES_DATA_DIR}/facilities_OG.json`)
);
facilities.forEach(({ code, facilityGroupCode, description }: any) => {
  const id = `${code}-${facilityGroupCode}`;
  if (description) formatted[id] = description.content;
});

fs.writeFileSync(
  `${HOTELS_TYPES_DATA_DIR}/facilities.json`,
  JSON.stringify(formatted)
);
