import type React from "react";
interface GooglePlacesAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
}
declare global {
    interface Window {
        google: any;
        initGooglePlaces: () => void;
    }
}
declare const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps>;
export default GooglePlacesAutocomplete;
//# sourceMappingURL=GooglePlacesAutocomplete.d.ts.map