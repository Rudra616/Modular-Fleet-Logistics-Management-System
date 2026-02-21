import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { getCurrentUser } from './store/slices/authSlice';
import { AppDispatch, RootState } from './store/store';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [token, user, dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;