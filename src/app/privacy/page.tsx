export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-white/60">
          We collect your email and name to provide the service.
          Your chat messages are stored securely in Supabase.
          We never share your data with third parties.
          You can delete your account and all data at any time.
        </p>
      </div>
    </div>
  );
}