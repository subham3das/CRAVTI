import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const Payments = () => {
  const { restaurant } = useAuth();
  const navigate = useNavigate();

  const isPaymentEnabled = restaurant?.paymentEnabled === true;
  const isBankSubmitted =
    restaurant?.bankDetails?.status === 'submitted' ||
    restaurant?.verificationStatus === 'submitted';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Settlements"
        description="Monitor online UPI, card transactions, and automated daily payouts."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/profile')}
          >
            Bank Settings
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Payment Gateway Status" subtitle="Settlement credentials">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Craviti Pay Integration</h4>
                  <p className="text-xs text-slate-500">QR Code Direct UPI &amp; Cards</p>
                </div>
              </div>
              <div>
                {isPaymentEnabled ? (
                  <Badge variant="success" size="sm" dot>Active</Badge>
                ) : isBankSubmitted ? (
                  <Badge variant="warning" size="sm" dot>Verification Pending</Badge>
                ) : (
                  <Badge variant="danger" size="sm" dot>Setup Required</Badge>
                )}
              </div>
            </div>

            {!isPaymentEnabled && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <FiAlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Online customer payments are currently held.</span>
                </div>
                <p>
                  Save your Bank Account and IFSC code in your Restaurant Profile to submit for verification.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  rightIcon={FiArrowRight}
                  onClick={() => navigate('/profile')}
                >
                  Configure Bank Details
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Daily Payout Schedule" subtitle="Automatic NEFT/IMPS transfers">
          <div className="space-y-3 text-xs text-slate-600">
            <p>• Payouts trigger automatically every day at 02:00 AM for the preceding day&apos;s settled dining orders.</p>
            <p>• Zero payment gateway commission during beta period.</p>
            <p>• Real-time settlement statements will populate here once live payment volume commences.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

