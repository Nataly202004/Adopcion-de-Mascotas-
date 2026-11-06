console.log('Base de datos simulada activa');

const db = {
  query: async (text, params) => {
    return { rows: [] };
  }
};

module.exports = db;
