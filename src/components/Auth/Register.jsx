import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: (pw) => pw.length >= 6,
    uppercase: (pw) => /[A-Z]/.test(pw),
    number: (pw) => /\d/.test(pw),
    special: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  };

  const calculateStrength = (pw) => {
    let score = 0;
    if (passwordChecks.length(pw)) score += 25;
    if (passwordChecks.uppercase(pw)) score += 25;
    if (passwordChecks.number(pw)) score += 25;
    if (passwordChecks.special(pw)) score += 25;
    return score;
  };

  const strength = calculateStrength(formData.password);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    const { password } = formData;
    if (!password) {
      errors.password = 'Password is required';
    } else {
      if (!passwordChecks.length(password)) errors.password = 'Min 6 characters required';
      else if (!passwordChecks.uppercase(password)) errors.password = 'One uppercase letter required';
      else if (!passwordChecks.number(password)) errors.password = 'One number required';
      else if (!passwordChecks.special(password)) errors.password = 'One special character required';
    }

    if (password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreed) {
      errors.agreed = 'You must agree to the terms';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
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
    const username = `${formData.firstName} ${formData.lastName}`;
    const result = await register(username, formData.email, formData.password);
    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
    } else {
      toast.success('Registration successful!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreed: false,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#6A1B9A] px-4 py-12">
      <div className="flex flex-col md:flex-row bg-white shadow-2xl rounded-3xl overflow-hidden max-w-6xl w-full">
        {/* Left Side */}
        <div className="md:w-1/2 bg-[#6A1B9A] text-white p-10 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold mb-3">Welcome Aboard</h2>
          <p className="text-sm text-white/80 mb-8 text-center">
            Let’s get you set up to launch your journey.
          </p>
          <img
            src="/Register.png"
            alt="Rocket illustration"
            className="w-[250px] md:w-[280px] object-contain"
          />
        </div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:w-1/2 bg-white text-[#6A1B9A] p-10"
        >
          <h3 className="text-2xl font-bold text-center mb-2">Create Your Account</h3>
          <p className="text-sm text-center text-gray-600 mb-6">Sign up to get started</p>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1/2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  aria-invalid={!!formErrors.firstName}
                  className={`w-full border px-4 py-2 rounded-md ${
                    formErrors.firstName ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                )}
              </div>
              <div className="w-1/2">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  aria-invalid={!!formErrors.lastName}
                  className={`w-full border px-4 py-2 rounded-md ${
                    formErrors.lastName ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!formErrors.email}
                className={`w-full border px-4 py-2 rounded-md ${
                  formErrors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={!!formErrors.password}
                className={`w-full border px-4 py-2 rounded-md ${
                  formErrors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-2.5 right-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
              )}
              <div className="w-full h-2 rounded-full bg-gray-200 mt-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    strength === 100
                      ? 'bg-green-500'
                      : strength >= 75
                      ? 'bg-yellow-400'
                      : strength >= 50
                      ? 'bg-orange-400'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${strength}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {strength === 100
                  ? 'Strong password'
                  : strength >= 75
                  ? 'Good'
                  : strength >= 50
                  ? 'Medium'
                  : 'Weak password (e.g.Abc@123)'}
              </p>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={!!formErrors.confirmPassword}
                className={`w-full border px-4 py-2 rounded-md ${
                  formErrors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-2.5 right-3 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {formErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>

            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="accent-purple-600"
                id="agreement"
              />
              I agree to the Terms and Conditions
            </label>
            {formErrors.agreed && (
              <p className="text-xs text-red-500 -mt-2">{formErrors.agreed}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6A1B9A] hover:bg-[#4A148C] text-white py-3 rounded-md font-medium transition disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-700 font-medium hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
