import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs for GSAP animations
  const titleRef = useRef(null);
  const formRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // Animate title
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    // Stagger input fields
    gsap.fromTo(
      formRef.current?.children,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.15,
        delay: 0.3,
      }
    );

    // Floating image animation
    gsap.to(imageRef.current, {
      y: 10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) errors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) errors.email = 'Invalid email';

    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Min 6 characters';

    return errors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#6A1B9A] px-4 text-white font-sans">
      <div className="flex flex-col md:flex-row bg-white text-gray-800 shadow-2xl rounded-3xl overflow-hidden max-w-6xl w-full">
        
        {/* Left Panel */}
        <div className="md:w-1/2 bg-[#6A1B9A] text-white p-10 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold mb-2">Social App</h2>
          <p className="text-sm text-white/90 mb-10 text-center">
            Welcome to the website. Please login to continue.
          </p>
          <img
            ref={imageRef}
            src="/Login.png"
            alt="Rocket Illustration"
            className="w-[220px] md:w-[260px] h-auto mx-auto drop-shadow-lg"
          />
        </div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:w-1/2 bg-white p-10"
        >
          <h3
            ref={titleRef}
            className="text-2xl font-bold text-center mb-2 text-[#6A1B9A]"
          >
            USER LOGIN
          </h3>
          <p className="text-sm text-center text-gray-500 mb-6">
            Welcome back! Please login to your account.
          </p>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded text-sm mb-4">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                aria-label="Email"
                aria-invalid={!!formErrors.email}
                className={`w-full py-3 pl-10 pr-4 border ${
                  formErrors.email ? 'border-red-400' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                aria-label="Password"
                aria-invalid={!!formErrors.password}
                className={`w-full py-3 pl-10 pr-10 border ${
                  formErrors.password ? 'border-red-400' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
                aria-label="Toggle Password Visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-purple-600" />
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6A1B9A] hover:bg-[#4A148C] text-white py-3 rounded-md font-medium transition duration-200 disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-sm text-center mt-6 text-gray-600">
            Don’t have an account?{' '}
            <Link to="/register" className="text-purple-700 hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
