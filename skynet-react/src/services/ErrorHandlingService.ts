export const errorUtils = {
  getError: (error) => {
    let e = error;
    console.log(error)
    if (error.response) {
      e = error.response.data; // data, status, headers
      if (error.response.data && error.response.data.error) {
        e = error.response.data.error; // app specific keys override
      }
    } else if (error.message) {
      e = error.message;
    } else {
      e = "Unknown error occurred";
    }
    return e;
  },
};
