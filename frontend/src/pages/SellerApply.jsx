import { useState, useEffect } from 'react';
import { Store, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/Axios';

const SellerApply = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [appStatus, setAppStatus] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        businessName: '',
        businessEmail: '',
        phone: '',
        taxId: '',
        documentUrl: ''
    });

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get('/seller/status');
                setAppStatus(res.data);
                if (res.data?.isSeller) {
                    navigate('/seller');
                }
            } catch (err) {
                console.error('Error fetching seller status:', err);
            } finally {
                setStatusLoading(false);
            }
        };
        checkStatus();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/seller/apply', {
                businessName: form.businessName,
                businessEmail: form.businessEmail,
                phone: form.phone,
                taxId: form.taxId,
                documentUrls: form.documentUrl ? [form.documentUrl] : []
            });

            setSuccess(res.data.message);
            setAppStatus(prev => ({
                ...prev,
                application: res.data.application
            }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    if (statusLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    const application = appStatus?.application;

    return (
        <div className="min-h-[85vh] py-12 max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="w-16 h-16 bg-accent/15 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Store size={32} />
                </div>
                <h1 className="text-3xl font-black text-secondary">Join MINIMAL. as an Independent Seller</h1>
                <p className="text-secondary/60 mt-2">
                    Showcase your collections to fashion enthusiasts globally with low 10% platform commission, fast payouts, and AI tools.
                </p>
            </div>

            {/* Application Pending State */}
            {application && application.status === 'pending' && (
                <div className="rounded-3xl border border-secondary/15 bg-secondary/5 p-8 text-center max-w-lg mx-auto shadow-sm">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary">Application Under Review</h2>
                    <p className="text-secondary/70 mt-3 text-sm leading-relaxed">
                        Your application for <span className="font-bold text-secondary">{application.business_name}</span> has been received and is currently being reviewed by our Super Admin team.
                    </p>
                    <div className="mt-6 p-4 rounded-xl bg-dominant border border-secondary/10 text-left text-xs space-y-1 text-secondary/70">
                        <p><span className="font-semibold text-secondary">Submission Date:</span> {new Date(application.created_at).toLocaleDateString()}</p>
                        <p><span className="font-semibold text-secondary">Business Email:</span> {application.business_email}</p>
                        <p><span className="font-semibold text-secondary">Status:</span> Pending Super Admin approval</p>
                    </div>
                </div>
            )}

            {/* Application Rejected State */}
            {application && application.status === 'rejected' && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto mb-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-red-700">Application Status: Revision Needed</h2>
                    <p className="text-red-600 mt-2 text-sm">
                        {application.admin_notes || 'Your application could not be verified with the information provided. Please update your details and resubmit.'}
                    </p>
                </div>
            )}

            {/* Application Form */}
            {(!application || application.status === 'rejected') && (
                <div className="bg-dominant border border-secondary/15 rounded-3xl p-8 shadow-sm">
                    {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">{error}</div>}
                    {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-200 flex items-center gap-2"><CheckCircle2 size={18} /> {success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">Business / Brand Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={form.businessName}
                                    onChange={e => setForm({ ...form, businessName: e.target.value })}
                                    placeholder="e.g. Atelier Studio"
                                    className="w-full px-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-secondary focus:outline-none focus:border-accent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">Business Contact Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.businessEmail}
                                    onChange={e => setForm({ ...form, businessEmail: e.target.value })}
                                    placeholder="contact@brand.com"
                                    className="w-full px-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-secondary focus:outline-none focus:border-accent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-secondary focus:outline-none focus:border-accent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-secondary mb-2">Tax ID / Business Registration (GSTIN/EIN)</label>
                                <input
                                    type="text"
                                    value={form.taxId}
                                    onChange={e => setForm({ ...form, taxId: e.target.value })}
                                    placeholder="e.g. 27AAAAA0000A1Z5"
                                    className="w-full px-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-secondary focus:outline-none focus:border-accent text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-secondary mb-2">Verification Document / Portfolio Link</label>
                            <input
                                type="url"
                                value={form.documentUrl}
                                onChange={e => setForm({ ...form, documentUrl: e.target.value })}
                                placeholder="https://drive.google.com/... or https://yourbrand.com"
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-secondary focus:outline-none focus:border-accent text-sm"
                            />
                            <p className="text-xs text-secondary/50 mt-1">Provide a link to your business registration, Instagram lookbook, or catalog documentation.</p>
                        </div>

                        <div className="pt-4 border-t border-secondary/10 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-secondary/60">
                                <ShieldCheck size={16} className="text-green-600" />
                                Protected by marketplace encryption & privacy standards.
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3.5 bg-secondary text-dominant font-bold rounded-xl hover:bg-accent transition cursor-pointer disabled:opacity-60"
                            >
                                {loading ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SellerApply;
