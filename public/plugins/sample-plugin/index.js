export default {
  name: 'sample-plugin',
  hooks: {
    beforeSave: async (context) => {
      console.log('Sample plugin beforeSave hook');
      return context;
    },
    afterSave: async (context) => {
      console.log('Sample plugin afterSave hook');
      return context;
    }
  }
};
