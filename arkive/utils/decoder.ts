export const decodeHexString = (hexString: `0x${string}`) => {
  // Step 1 and 2: Convert hex string to byte array
  let substring = hexString.substring(2);
  let lastNonZeroIndex = substring.length;
  for (let i = substring.length - 2; i >= 0; i -= 2) {
    if (substring.substring(i, i + 2) !== "00") {
      lastNonZeroIndex = i + 2;
      break;
    }
  }

  // Step 2: Trim the hex string to remove trailing zero bytes
  substring = substring.substring(0, lastNonZeroIndex);

  // Step 3: Convert hex string to byte array
  const bytes = [];
  for (let i = 0; i < substring.length; i += 2) {
    bytes.push(parseInt(substring.substring(i, i + 2), 16));
  }

  // Step 4: Create a Uint8Array from bytes
  const uint8array = new Uint8Array(bytes);

  // Step 5: Decode using TextDecoder
  const textDecoder = new TextDecoder("utf-8");
  return textDecoder.decode(uint8array);
};
