// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// const RegisterForm = ({ onSwitchToLogin }) => {
//   const { register, loading, error } = useAuth();
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     await register(formData.email, formData.password, formData.name);
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
//         🤖 Create Account
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
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Full Name"
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
//             placeholder="Password (min 6 chars)"
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
//           {loading ? 'Creating Account...' : 'Create Account'}
//         </button>
//       </form>
      
//       <p style={{ textAlign: 'center', marginTop: '1rem' }}>
//         Already have an account?{' '}
//         <button 
//           onClick={onSwitchToLogin}
//           style={{ 
//             background: 'none', 
//             border: 'none', 
//             color: '#667eea', 
//             cursor: 'pointer', 
//             textDecoration: 'underline' 
//           }}
//         >
//           Sign In
//         </button>
//       </p>
//     </div>
//   );
// };

// export default RegisterForm;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebaseAuthService from '../services/firebaseAuth';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await firebaseAuthService.register(
        email, 
        password, 
        name, 
        isAdmin ? 'admin' : 'user'
      );
      
      if (result.success) {
        // Redirect based on role
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-700">Register as Admin</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
