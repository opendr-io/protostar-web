import { createSlice } from '@reduxjs/toolkit';

export const DataManagement = createSlice(
{
  name: 'data',
  initialState: { value: '' },
  reducers: 
  {
    setData: (state, action) => 
    {
      state.value = action.payload;
    }
  }
});

export const { setData } = DataManagement.actions;
export default DataManagement.reducer;