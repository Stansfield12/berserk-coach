import { configureStore } from '@reduxjs/toolkit';

// В реальном приложении здесь бы были импортированы все слайсы
// import mentorSlice from './slices/mentorSlice';
// import strategicSlice from './slices/strategicSlice';
// и т.д.

// Пока создаем пустое хранилище
export const store = configureStore({
  reducer: {
    // mentor: mentorSlice,
    // strategic: strategicSlice,
    // и т.д.
  },
});

// Типы для использования с useSelector и useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;