import { createSlice } from '@reduxjs/toolkit';
const DataManagement = createSlice(
{
  name: 'data',
  initialState: { value: '' },
  reducers: {
    setData: (state: any, action: any) => 
    {
      state.value = action.payload;
    }
  }
});

export const { setData } = DataManagement.actions;
export default DataManagement.reducer;