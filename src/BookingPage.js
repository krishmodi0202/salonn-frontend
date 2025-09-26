import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingPage.css';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);

  // Services offered
  const services = [
    { id: 'haircut', name: 'Haircut', price: '$25', duration: '30 min' },
    { id: 'beard-trim', name: 'Beard Trim', price: '$15', duration: '20 min' },
    { id: 'shave', name: 'Classic Shave', price: '$20', duration: '25 min' },
    { id: 'haircut-beard', name: 'Haircut + Beard Package', price: '$35', duration: '45 min' },
    { id: 'deluxe-package', name: 'Deluxe Package', price: '$50', duration: '60 min' }
  ];

  // Available stylists
  const stylists = [
    { id: 'any', name: 'Any Available Stylist' },
    { id: 'john', name: 'John Smith - Senior Barber' },
    { id: 'mike', name: 'Mike Johnson - Master Stylist' },
    { id: 'alex', name: 'Alex Brown - Traditional Barber' }
  ];

  // Generate time slots based on selected date and stylist
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, selectedStylist]);

  const generateTimeSlots = async () => {
    try {
      // Generate all possible time slots
      const allSlots = [];
      const startHour = 9; // 9 AM
      const endHour = 18; // 6 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push(timeString);
        }
      }

      // Fetch booked slots from backend
      const response = await axios.get(`${API_BASE_URL}/bookings/availability/${selectedDate}`);
      const bookedSlots = response.data.bookedSlots || [];
      
      // Create slots with availability info
      const slots = allSlots.map(time => {
        const isBooked = bookedSlots.some(booking => 
          booking.time === time && 
          (selectedStylist === 'any' || booking.stylist === selectedStylist || selectedStylist === '')
        );
        return {
          time,
          available: !isBooked
        };
      });
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Fallback to all slots available if API fails
      const slots = [];
      const startHour = 9;
      const endHour = 18;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time: timeString,
            available: true
          });
        }
      }
      setAvailableSlots(slots);
    }
  };

  const handleCustomerDetailsChange = (field, value) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooking = async () => {
    // Validate form
    if (!selectedDate || !selectedTime || !selectedService || !customerDetails.name || !customerDetails.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Prepare booking data
      const bookingData = {
        date: selectedDate,
        time: selectedTime,
        service: selectedService,
        stylist: selectedStylist || 'any',
        customer: customerDetails
      };

      // Send booking to backend
      const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData);

      if (response.data.success) {
        setIsBookingConfirmed(true);
        
        // Show success message with booking ID
        setTimeout(() => {
          alert(`Booking confirmed! 
          
Booking ID: ${response.data.data.bookingId}
Date: ${selectedDate}
Time: ${selectedTime}
Service: ${services.find(s => s.id === selectedService)?.name}
Stylist: ${stylists.find(s => s.id === selectedStylist)?.name}

A confirmation message will be sent to your phone/email.`);
        }, 1000);
      }
    } catch (error) {
      console.error('Booking failed:', error);
      
      if (error.response?.data?.message) {
        alert(`Booking failed: ${error.response.data.message}`);
      } else {
        alert('Booking failed. Please check your internet connection and try again.');
      }
    }
  };

  const resetBooking = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedService('');
    setSelectedStylist('');
    setCustomerDetails({
      name: '',
      phone: '',
      email: '',
      whatsapp: ''
    });
    setIsBookingConfirmed(false);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  if (isBookingConfirmed) {
    return (
      <div className="booking-container">
        <div className="booking-card">
          <div className="confirmation-message">
            <div className="success-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Thank you for choosing our barber shop. Your appointment has been successfully booked.</p>
            <div className="booking-summary">
              <h3>Appointment Details:</h3>
              <p><strong>Date:</strong> {selectedDate}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Service:</strong> {services.find(s => s.id === selectedService)?.name}</p>
              <p><strong>Stylist:</strong> {stylists.find(s => s.id === selectedStylist)?.name}</p>
              <p><strong>Customer:</strong> {customerDetails.name}</p>
            </div>
            <button className="btn btn-primary" onClick={resetBooking}>
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <header className="booking-header">
          <h1>Book Your Appointment</h1>
          <p>Choose your preferred date, time, and service</p>
        </header>

        <div className="booking-form">
          {/* Date Selection */}
          <div className="form-section">
            <h3>📅 Select Date</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="date-input"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="form-section">
              <h3>🕐 Available Time Slots</h3>
              <div className="time-slots">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`time-slot ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                  >
                    {slot.time}
                    {!slot.available && <span className="unavailable-text">Booked</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Service Selection */}
          <div className="form-section">
            <h3>✂️ Select Service</h3>
            <div className="services-grid">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <h4>{service.name}</h4>
                  <p className="service-price">{service.price}</p>
                  <p className="service-duration">{service.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stylist Selection */}
          <div className="form-section">
            <h3>👨‍💼 Choose Your Stylist</h3>
            <div className="stylist-selection">
              {stylists.map((stylist) => (
                <label key={stylist.id} className="stylist-option">
                  <input
                    type="radio"
                    name="stylist"
                    value={stylist.id}
                    checked={selectedStylist === stylist.id}
                    onChange={(e) => setSelectedStylist(e.target.value)}
                  />
                  <span className="stylist-name">{stylist.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          <div className="form-section">
            <h3>📝 Your Details</h3>
            <div className="customer-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) => handleCustomerDetailsChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={customerDetails.phone}
                    onChange={(e) => handleCustomerDetailsChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={customerDetails.email}
                    onChange={(e) => handleCustomerDetailsChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="whatsapp">WhatsApp Number</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    value={customerDetails.whatsapp}
                    onChange={(e) => handleCustomerDetailsChange('whatsapp', e.target.value)}
                    placeholder="WhatsApp number (optional)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Book Now Button */}
          <div className="form-section">
            <button
              className="btn btn-primary btn-large"
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime || !selectedService || !customerDetails.name || !customerDetails.phone}
            >
              📅 Book Now
            </button>
            <p className="booking-note">
              * Required fields. You'll receive a confirmation via SMS/WhatsApp and email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
