import React from 'react';

interface SuggestionsProps {
    category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
}

const suggestionData = {
    'Underweight': {
        title: "Focus on Nutrient-Rich Foods",
        points: [
            "Consider eating smaller, more frequent meals throughout the day.",
            "Incorporate healthy fats like avocados, nuts, and seeds.",
            "Choose whole grains and lean protein sources to build healthy muscle mass."
        ]
    },
    'Normal weight': {
        title: "Keep Up the Great Work!",
        points: [
            "Maintain a balanced diet with plenty of fruits, vegetables, and whole grains.",
            "Stay active with regular physical activity that you enjoy.",
            "Continue to monitor your health and listen to your body's needs."
        ]
    },
    'Overweight': {
        title: "Focus on a Balanced Lifestyle",
        points: [
            "Incorporate more whole foods like fruits, vegetables, and lean proteins.",
            "Aim for regular physical activity, such as brisk walking, cycling, or swimming.",
            "Consider portion control and mindful eating to better manage calorie intake."
        ]
    },
    'Obese': {
        title: "Building Healthier Habits",
        points: [
            "Start with small, sustainable changes to your diet and activity levels.",
            "Focus on a balanced diet rich in fiber and protein to help you feel full.",
            "It is highly recommended to consult with a healthcare professional or a registered dietitian to create a safe and personalized plan."
        ]
    }
}

export const Suggestions: React.FC<SuggestionsProps> = ({ category }) => {
    const suggestions = suggestionData[category];
    
    if (!suggestions) return null;
    
    return (
        <div className="w-full bg-gray-900 rounded-lg p-6 text-left">
            <h3 className="text-xl font-bold text-white mb-3">{suggestions.title}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
                {suggestions.points.map((point, index) => (
                    <li key={index}>{point}</li>
                ))}
            </ul>
             <p className="text-xs text-gray-500 mt-4">
                <strong>Disclaimer:</strong> These are general suggestions and not medical advice. Always consult with a healthcare professional for personalized guidance.
            </p>
        </div>
    );
};