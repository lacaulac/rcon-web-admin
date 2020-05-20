
const base64 = {
  /**
     * Decode
     * @param {string} s
     * @returns {string}
     */
  decode(s) {
    const buff = Buffer.from(s, 'base64');
    return buff.toString('ascii');
  },
};

module.exports = base64;
