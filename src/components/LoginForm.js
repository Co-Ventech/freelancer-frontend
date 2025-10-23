// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// const LoginForm = ({ onSwitchToRegister }) => {
//   const { login, loading, error } = useAuth();
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     await login(formData.email, formData.password);
//   };

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   return (
//     <div style={{ 
//       background: 'white', 
//       padding: '2rem', 
//       borderRadius: '8px', 
//       width: '300px',
//       boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
//     }}>
//       <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
//         🤖 Login
//       </h2>
      
//       {error && (
//         <div style={{ 
//           background: '#fee', 
//           color: '#c33', 
//           padding: '0.5rem', 
//           borderRadius: '4px', 
//           marginBottom: '1rem' 
//         }}>
//           {error}
//         </div>
//       )}
      
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '1rem' }}>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="Email"
//             required
//             disabled={loading}
//             style={{ 
//               width: '100%', 
//               padding: '0.5rem', 
//               border: '1px solid #ddd', 
//               borderRadius: '4px' 
//             }}
//           />
//         </div>
        
//         <div style={{ marginBottom: '1rem' }}>
//           <input
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="Password"
//             required
//             disabled={loading}
//             style={{ 
//               width: '100%', 
//               padding: '0.5rem', 
//               border: '1px solid #ddd', 
//               borderRadius: '4px' 
//             }}
//           />
//         </div>
        
//         <button 
//           type="submit" 
//           disabled={loading}
//           style={{ 
//             width: '100%', 
//             padding: '0.75rem', 
//             background: '#667eea', 
//             color: 'white', 
//             border: 'none', 
//             borderRadius: '4px', 
//             cursor: 'pointer' 
//           }}
//         >
//           {loading ? 'Signing In...' : 'Sign In'}
//         </button>
//       </form>
      
//       <p style={{ textAlign: 'center', marginTop: '1rem' }}>
//         Don't have an account?{' '}
//         <button 
//           onClick={onSwitchToRegister}
//           style={{ 
//             background: 'none', 
//             border: 'none', 
//             color: '#667eea', 
//             cursor: 'pointer', 
//             textDecoration: 'underline' 
//           }}
//         >
//           Sign Up
//         </button>
//       </p>
//     </div>
//   );
// };

// export default LoginForm;


import React, { useState } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import firebaseAuthService from '../services/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useFirebaseAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await firebaseAuthService.login(email, password);
      
      if (result.success) {
        // Check user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        const userData = userDoc.data();
        
        // Redirect based on role
        if (userData?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline"
          >
            Register
          </button>
        </p> */}
      </div>
    </div>
  );
};

export default LoginForm;
