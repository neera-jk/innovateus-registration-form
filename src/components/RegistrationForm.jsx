import { useState } from "react";
import "./RegistrationForm.css";

// The list of US states/territories, exactly as the real InnovateUS form shows them.
// Kept as a separate array so the JSX below stays clean and easy to read.
const US_STATES = [
    "AL", "AK", "AS", "AZ", "AR", "CA", "CO", "CT", "DE", "DC",
    "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
    "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE",
    "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK",
    "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
    "VA", "VI", "WA", "WV", "WI", "WY",
];

// The four government-organization answers, exactly as the real form lists them.
const GOV_ORG_OPTIONS = [
    "Yes, I'm an employee of a government agency",
    "Yes, I'm a contractor or consultant working with a government agency",
    "Yes, I work for a government-affiliated organization (e.g., public university, nonprofit, or quasi-governmental organization)",
    "No, I do not work for or support a government or government-affiliated organization",
];

// The seven government-level answers, exactly as the real form lists them.
const GOV_LEVEL_OPTIONS = [
    "International or Intergovernmental Organization (e.g. UN, OECD, EU)",
    "National or Federal Level",
    "State or Provincial level",
    "Tribal Government",
    "County or equivalent level",
    "Municipal, City, or Local level",
    "Other level not listed here",
];

// All 14 event series a person can register for, exactly as the real form lists them.
const EVENT_SERIES = [
    "Practical Approaches to Evaluating AI for Public Benefit",
    "AI, Energy, and the Environment: Use, Policy, and Tradeoffs",
    "AI for Public-Sector Procurement",
    "Democratic and Public AI: Practical Strategies for Buying, Building, and Governing AI",
    "AI in Public Health",
    "The Good, the Bad and the Ugly of Predictive AI",
    "Using AI in Public Sector Legal Practice",
    "Worker-Centered AI Adoption in the Public Sector",
    "AI Insourcing and the Government Product Model",
    "Amplify: Mastering Public Communication in the AI Age",
    "Working with AI Agents in the Public Sector: What Works (and What Doesn't)",
    "AI for Public HR Professionals",
    "AI and Cybersecurity in the Public Sector for the Non-Expert",
    "The Prompting Lab: Real Prompts, Real Challenges, All Platforms",
];

// A helper that decides whether the chosen gov_org answer is a "Yes".
// The gov_level field should only appear for the "Yes" answers.
// Keeping this as its own named function makes the condition below easy to read.
function isGovernmentYes(govOrgAnswer) {
    return govOrgAnswer.startsWith("Yes");
}

function RegistrationForm() {
    // One object holds every simple (single-value) field.
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        country: "",
        state: "",
        gov_org: "",
        gov_level: "",
        newsletter: false,
    });

    // The event series are handled separately from formData because they are
    // a LIST of choices, not a single value. We track which series titles are
    // currently ticked. Starts empty (nothing ticked).
    const [selectedSeries, setSelectedSeries] = useState([]);

    // Tracks the submission stage: "idle", "submitting", "success", "error".
    const [submitStatus, setSubmitStatus] = useState("idle");

    // Updates any of the simple fields in formData.
    // Text/select inputs report event.target.value.
    // The checkbox (newsletter) reports event.target.checked (true/false).
    function handleInputChange(event) {
        const fieldName = event.target.name;
        const inputType = event.target.type;

        let newValue;
        if (inputType === "checkbox") {
            newValue = event.target.checked;
        } else {
            newValue = event.target.value;
        }

        setFormData({
            ...formData,
            [fieldName]: newValue,
        });
    }

    // Runs when the user ticks or unticks one of the event series checkboxes.
    // If the series is already in our list, we remove it (they unticked it).
    // If it is not in the list, we add it (they ticked it).
    function handleSeriesToggle(seriesTitle) {
        if (selectedSeries.includes(seriesTitle)) {
            // Remove it: keep every series EXCEPT this one.
            const updatedList = selectedSeries.filter(function (title) {
                return title !== seriesTitle;
            });
            setSelectedSeries(updatedList);
        } else {
            // Add it: copy the existing list and append this one.
            setSelectedSeries([...selectedSeries, seriesTitle]);
        }
    }

    // Decides whether every series is currently selected.
    // Used to flip the button between "select all" and "unselect all".
    function areAllSeriesSelected() {
        return selectedSeries.length === EVENT_SERIES.length;
    }

    // One button handles both directions:
    // if everything is already selected, clear the list;
    // otherwise, select every series.
    function handleToggleAllSeries() {
        if (areAllSeriesSelected()) {
            setSelectedSeries([]);
        } else {
            setSelectedSeries([...EVENT_SERIES]);
        }
    }

    // Basic validation. Returns an error message string if something is wrong,
    // or an empty string if everything is fine.
    function getValidationError() {
        if (formData.email.trim() === "" || !formData.email.includes("@")) {
            return "Please enter a valid email address.";
        }
        if (formData.first_name.trim() === "") {
            return "Please enter your first name.";
        }
        if (formData.last_name.trim() === "") {
            return "Please enter your last name.";
        }
        if (formData.country === "") {
            return "Please select a country.";
        }
        if (formData.state.trim() === "") {
            // For US this is a state selection; for outside US it is the typed country name.
            return "Please fill in the state/province or country field.";
        }
        if (formData.gov_org === "") {
            return "Please answer the government organization question.";
        }
        if (selectedSeries.length === 0) {
            return "Please select at least one event series.";
        }
        return "";
    }

    // Runs when the user clicks Register.
    function handleSubmit(event) {
        event.preventDefault();

        const errorMessage = getValidationError();
        if (errorMessage !== "") {
            alert(errorMessage);
            return;
        }

        // Turn the list of ticked series into a single comma-joined string,
        // because the database stores workshop_series as one text value.
        const workshopSeriesString = selectedSeries.join(", ");

        // Assemble the final object that matches the database fields.
        const finalData = {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            country: formData.country,
            state: formData.state,
            gov_org: formData.gov_org,
            gov_level: formData.gov_level,
            workshop_series: workshopSeriesString,
            newsletter: formData.newsletter,
        };

        // For now, just print it. Database wiring comes in the next step.
        console.log("Final data ready to send:", finalData);
        alert("Form is valid. Data printed to the console. (Database wiring comes next.)");
    }

    return (
        <div className="page-background">
            {/*
        A lightweight header that echoes the InnovateUS wordmark and nav.
        This is a visual match, not a working nav; the links are not wired
        anywhere because the assignment is about the registration form.
      */}
            <header className="site-header">
                <div className="wordmark">
                    innovate<span className="wordmark-us">(us)</span>
                </div>
                <nav className="site-nav">
                    <span>Ways to Learn</span>
                    <span>Featured Topics</span>
                    <span>News &amp; Perspectives</span>
                    <span>About Us</span>
                    <span className="nav-updates">Sign up for updates</span>
                </nav>
            </header>

            <div className="registration-card">
                <p className="section-eyebrow">Registration Details</p>

                <form onSubmit={handleSubmit} className="registration-form">
                    {/* Email */}
                    <div className="form-field">
                        <label htmlFor="email">
                            Email <span className="required-star">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* First name + Last name, side by side */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="first_name">
                                First Name <span className="required-star">*</span>
                            </label>
                            <input
                                id="first_name"
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="last_name">
                                Last Name <span className="required-star">*</span>
                            </label>
                            <input
                                id="last_name"
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Country + State/Province, side by side */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="country">
                                Country <span className="required-star">*</span>
                            </label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                            >
                                <option value="">Select country (required)</option>
                                <option value="United States">United States</option>
                                <option value="Outside the United States">
                                    Outside the United States
                                </option>
                            </select>
                        </div>

                        {/*
              This field changes shape based on the country choice:
              - United States  -> a dropdown of US state abbreviations
              - Outside the US  -> a text box to type the country name
              Both write to the same formData.state field.
              If no country is picked yet, we show nothing here.
            */}
                        {formData.country === "United States" && (
                            <div className="form-field">
                                <label htmlFor="state">
                                    State/Province <span className="required-star">*</span>
                                </label>
                                <select
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select state (required)</option>
                                    {US_STATES.map(function (stateCode) {
                                        return (
                                            <option key={stateCode} value={stateCode}>
                                                {stateCode}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {formData.country === "Outside the United States" && (
                            <div className="form-field">
                                <label htmlFor="state">
                                    Country name <span className="required-star">*</span>
                                </label>
                                <input
                                    id="state"
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    placeholder="Enter your country"
                                />
                            </div>
                        )}
                    </div>

                    {/* Government org question + conditional government level */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="gov_org">
                                Do you work for or primarily support a government or
                                government-affiliated organization?{" "}
                                <span className="required-star">*</span>
                            </label>
                            <select
                                id="gov_org"
                                name="gov_org"
                                value={formData.gov_org}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                {GOV_ORG_OPTIONS.map(function (optionText) {
                                    return (
                                        <option key={optionText} value={optionText}>
                                            {optionText}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/*
              gov_level only appears when the gov_org answer is a "Yes".
              We use the isGovernmentYes helper to keep this readable.
            */}
                        {isGovernmentYes(formData.gov_org) && (
                            <div className="form-field">
                                <label htmlFor="gov_level">
                                    If a government employee or consultant: What level of
                                    government? <span className="required-star">*</span>
                                </label>
                                <select
                                    id="gov_level"
                                    name="gov_level"
                                    value={formData.gov_level}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {GOV_LEVEL_OPTIONS.map(function (optionText) {
                                        return (
                                            <option key={optionText} value={optionText}>
                                                {optionText}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Event series section */}
                    <div className="series-section">
                        <h2 className="series-heading">Selected Event Series</h2>
                        <p className="series-subtext">
                            You are registering for {selectedSeries.length} event series.
                        </p>

                        <button
                            type="button"
                            className="select-all-button"
                            onClick={handleToggleAllSeries}
                        >
                            {areAllSeriesSelected()
                                ? "Unselect All Series"
                                : "Select All Series"}
                        </button>

                        {/*
              We show one checkbox per event series. Each checkbox is
              "checked" if its title is in our selectedSeries list.
              Clicking it calls handleSeriesToggle to add or remove it.
            */}
                        <div className="series-list">
                            {EVENT_SERIES.map(function (seriesTitle) {
                                return (
                                    <label key={seriesTitle} className="series-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedSeries.includes(seriesTitle)}
                                            onChange={function () {
                                                handleSeriesToggle(seriesTitle);
                                            }}
                                        />
                                        <span>{seriesTitle}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Newsletter opt-in: the new field the assignment asks for */}
                    <label className="newsletter-label">
                        <input
                            type="checkbox"
                            name="newsletter"
                            checked={formData.newsletter}
                            onChange={handleInputChange}
                        />
                        <span>Subscribe to our weekly newsletter</span>
                    </label>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={submitStatus === "submitting"}
                    >
                        {submitStatus === "submitting" ? "Submitting..." : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegistrationForm;