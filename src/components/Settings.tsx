import React, { useState, useRef } from 'react';
import { ArrowLeft, User, Bell, Shield, Palette, Database, Upload, X, Camera, Flag } from 'lucide-react';
import { AuthContext } from './AuthContext';
import { useFeatureFlags } from './FeatureFlagsContext';
import { AVATARS, getAvatarById, getDefaultAvatar } from '../utils/avatars';

interface SettingsProps {
    onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [selectedAvatar, setSelectedAvatar] = useState<string>('');
    const [customImage, setCustomImage] = useState<string>('');
    const [showAvatarGrid, setShowAvatarGrid] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = React.useContext(AuthContext);
    const { flags, updateFlag } = useFeatureFlags();

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setCustomImage(result);
                setSelectedAvatar(''); // Clear avatar selection when custom image is selected
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle avatar selection
    const handleAvatarSelect = (avatarId: string) => {
        setSelectedAvatar(avatarId);
        setCustomImage(''); // Clear custom image when avatar is selected
    };

    // Remove custom image
    const removeCustomImage = () => {
        setCustomImage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Save profile picture changes
    const saveProfilePicture = () => {
        // Here you would typically save to your backend
        // For now, we'll just show a success message
        // You can implement actual saving logic here
    };

    const settingsSections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'features', label: 'Feature Flags', icon: Flag },
        { id: 'data', label: 'Data & Storage', icon: Database },
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        {/* Profile Picture Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                            <div className="flex items-start gap-6">
                                {/* Current Profile Picture Preview */}
                                <div className="flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                        {customImage ? (
                                            <img
                                                src={customImage}
                                                alt="Profile Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : selectedAvatar ? (
                                            <div className={`w-full h-full ${getAvatarById(selectedAvatar).color} flex items-center justify-center text-white text-2xl`}>
                                                {getAvatarById(selectedAvatar).emoji}
                                            </div>
                                        ) : user?.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt="Current Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${getDefaultAvatar().color} flex items-center justify-center text-white text-2xl`}>
                                                {getDefaultAvatar().emoji}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload and Avatar Options */}
                                <div className="flex-1 space-y-4">
                                    {/* Custom Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Custom Image</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                <Upload size={16} />
                                                Choose File
                                            </button>
                                            {customImage && (
                                                <button
                                                    onClick={removeCustomImage}
                                                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <X size={16} />
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Avatar Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Choose Avatar</label>
                                        <button
                                            onClick={() => setShowAvatarGrid(!showAvatarGrid)}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            <Camera size={16} />
                                            {showAvatarGrid ? 'Hide Avatars' : 'Select Avatar'}
                                        </button>

                                        {showAvatarGrid && (
                                            <div className="mt-3 grid grid-cols-6 gap-3">
                                                {AVATARS.map((avatar) => (
                                                    <button
                                                        key={avatar.id}
                                                        onClick={() => handleAvatarSelect(avatar.id)}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${selectedAvatar === avatar.id
                                                            ? 'ring-2 ring-blue-500 ring-offset-2'
                                                            : 'hover:scale-110'
                                                            }`}
                                                    >
                                                        <div className={`w-full h-full ${avatar.color} rounded-full flex items-center justify-center`}>
                                                            {avatar.emoji}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user ? `${user.firstName} ${user.lastName}` : ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Tell us about yourself"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                onClick={saveProfilePicture}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                                </div>
                                <input type="checkbox" className="rounded" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Problem Reminders</h4>
                                    <p className="text-sm text-gray-600">Get reminded about unsolved problems</p>
                                </div>
                                <input type="checkbox" className="rounded" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Revision Alerts</h4>
                                    <p className="text-sm text-gray-600">Notifications for revision schedules</p>
                                </div>
                                <input type="checkbox" className="rounded" />
                            </div>
                        </div>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                                    <p className="text-sm text-gray-600">Make your profile visible to others</p>
                                </div>
                                <input type="checkbox" className="rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Data Analytics</h4>
                                    <p className="text-sm text-gray-600">Allow analytics to improve your experience</p>
                                </div>
                                <input type="checkbox" className="rounded" defaultChecked />
                            </div>
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <h4 className="font-medium text-yellow-800">Change Password</h4>
                                <p className="text-sm text-yellow-700 mt-1">Keep your account secure with a strong password</p>
                                <button className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Light</button>
                                    <button className="px-4 py-2 bg-gray-800 text-white rounded-md">Dark</button>
                                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">System</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'features':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Enable or disable experimental features. Changes take effect immediately.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Roadmaps Feature</h4>
                                    <p className="text-sm text-gray-600">
                                        Enable the learning roadmaps functionality (currently in development)
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={flags.roadmaps}
                                        onChange={(e) => updateFlag('roadmaps', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Placeholder for future feature flags */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">More features coming soon...</h4>
                                <p className="text-sm text-gray-600">
                                    Additional experimental features will appear here as they become available.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Storage</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="font-medium text-blue-800">Export Data</h4>
                                <p className="text-sm text-blue-700 mt-1">Download your data in JSON format</p>
                                <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                    Export Data
                                </button>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <h4 className="font-medium text-red-800">Delete Account</h4>
                                <p className="text-sm text-red-700 mt-1">Permanently delete your account and all data</p>
                                <button className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {settingsSections.map((section) => {
                                const IconComponent = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${activeSection === section.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <IconComponent size={18} />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {renderSectionContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
