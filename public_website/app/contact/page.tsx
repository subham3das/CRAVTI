'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SITE_CONFIG } from '../../constants/site';
import env from '../../config/env';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  User,
} from 'lucide-react';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    restaurant: '',
    email: '',
    phone: '',
    tables: '10-25',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const apiUrl = env.API_URL;
      const res = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          restaurant: formData.restaurant,
          tables: formData.tables,
          subject: formData.restaurant ? `Inquiry from ${formData.restaurant} (${formData.name})` : 'Contact Form Submission',
          message: formData.message || `Interested in Craviti for ${formData.restaurant || 'restaurant'} (${formData.tables} tables).`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        toast.success("Thank you! Your message has been sent successfully.");
        setFormData({
          name: '',
          restaurant: '',
          email: '',
          phone: '',
          tables: '10-25',
          message: '',
        });
        setFormSubmitted(true);
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      console.error('Contact form submission error:', err);
      toast.error('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-8">
          <Badge variant="primary" size="md">
            Get in Touch
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-display">
            Let&apos;s Accelerate Your{' '}
            <span className="text-[#FF6B35]">Restaurant Growth</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal">
            Have questions about our contactless QR system, Kitchen Display terminals, or direct Razorpay settlements? Our team replies within 15 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Info Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 space-y-6 bg-white">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Direct Communications
              </h3>

              <div className="space-y-5 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Founder & CEO</span>
                    <span className="font-bold text-slate-900 block">Subham Das</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Phone Hotline</span>
                    <a href="tel:9954060000" className="font-bold text-slate-900 hover:text-[#FF6B35]">
                      9954060000
                    </a>
                    <span className="text-[11px] text-slate-500 block">Mon - Sun: 8:00 AM - 11:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Email</span>
                    <a href="mailto:contactcraviti@gmail.com" className="font-bold text-slate-900 hover:text-[#FF6B35] block">
                      contactcraviti@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Location</span>
                    <p className="text-slate-700 leading-snug font-medium">
                      Dibrugarh, Assam, India
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-[#111827] text-white p-7 rounded-3xl shadow-soft space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B35] text-white uppercase tracking-wider inline-block">
                Instant Access
              </span>
              <h4 className="text-base font-bold font-display">Already Registered?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log into your existing restaurant dashboard to manage live orders, menu items, or view settlement records.
              </p>
              <div className="pt-2">
                <a
                  href={`${SITE_CONFIG.appUrl}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <span>Go to Restaurant Login &rarr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="p-8 sm:p-10 bg-white">
              {formSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">
                    Thank You, {formData.name}!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Your inquiry has been routed to our Senior Restaurant Solutions Engineer. We will contact you at{' '}
                    <strong className="text-slate-900">{formData.email}</strong> within 15 minutes.
                  </p>
                  <Button
                    onClick={() => setFormSubmitted(false)}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Send an Inquiry</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tell us about your restaurant and scheduling requirements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Chef Rajesh Sharma"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#FF6B35]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.restaurant}
                        onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                        placeholder="e.g., Spice Garden Bistro"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@spicegarden.com"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#FF6B35]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Dining Tables Count
                    </label>
                    <select
                      value={formData.tables}
                      onChange={(e) => setFormData({ ...formData, tables: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#FF6B35]"
                    >
                      <option value="1-10">1 - 10 Tables (Cafe / Quick Counter)</option>
                      <option value="10-25">10 - 25 Tables (Standard Casual Diner)</option>
                      <option value="25-50">25 - 50 Tables (High-Volume Bistro / Lounge)</option>
                      <option value="50+">50+ Tables (Banquet / Multi-Outlet Chain)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      How Can We Help You?
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your current point of sale, kitchen bottlenecks, or onboarding timeline..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#FF6B35]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="md"
                    variant="primary"
                    disabled={submitting}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="w-full text-xs font-bold shadow-soft"
                  >
                    {submitting ? 'Connecting to Production Cloud...' : 'Submit Inquiry to Onboarding Team'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

