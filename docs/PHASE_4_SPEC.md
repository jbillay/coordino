#Phase 4: Scheduling Assistant#

## 1. Executive Summary 🌍

The **Scheduling Assistant** feature is designed to solve the challenges of scheduling meetings in a global, multi-timezone environment. It is an intuitive solution that enables organizers to identify and select the time slot that offers the **best fairness score** (minimum disruption) for all participants, by integrating working hour constraints, cultural preferences, and local holidays.

---

## 2. Key Interface Features 🖥️

### A. Smart Input: The Equity Dial

This is the main screen showing the immediate impact of the time chosen by the organizer.

* **Starting Point:** The organizer enters the time in their own timezone (e.g., 5:00 PM CET).
* **The Equity Dial:** Displays a **Global Equity Score** (e.g., 85/100) and the distribution of participants by color zone (🟢/🟠/🔴).
* **Detailed List:** A table shows the local time, status (color), and working window for each country.

### B. Optimal Suggestion: The Range Visualizer

This feature helps the organizer find the best slot without guesswork.

* **Heatmap/Graph:** A graphic displays the entire day, with bars whose height and color represent the **Equity Score** at that hour. Green peaks indicate the **"Sweet Spots"** (optimal slots).
* **Top 3 Suggestions:** A list of the 3 time slots that automatically maximize the Equity Score.

---

## 3. Tool Logic and Intelligence 🧠

### A. The Color Code (Customizable)

The system uses thresholds to define the comfortable working time zone for each participant, based on their local time.

| Color | Status | Default Working Window |
| :---: | :--- | :--- |
| **🟢 GREEN** | **Optimal** | Standard work hours: **9:00 AM – 5:00 PM** |
| **🟠 ORANGE** | **Acceptable** | Slightly outside optimal hours: **8:00 AM – 9:00 AM** and **5:00 PM – 6:00 PM** |
| **🔴 RED** | **To Avoid** | Outside acceptable hours (before 8:00 AM or after 6:00 PM) or if critical conflict. |

### B. Cultural Flexibility (Configuration)

The user can override the default configuration to adapt to cultural realities or client preferences:

* **Local Profiles:** Defining specific Green/Orange windows per country (e.g., later start time in Southern Europe).

### C. Management of Local Events and Specifics

| Specificity | Application Logic | Indicator |
| :--- | :--- | :--- |
| **National Holidays** | Integration of a database. If the selected slot falls on a local holiday, the status automatically changes to **🔴 Red**. | 🚨 Specific alert displayed on the interface. |
| **Daylight Saving Time (DST)** | Automatic calculation of the time shift, accounting for the specific DST change dates in each country. | Informative note if planning is far in the future. |
| **Work Week** | Accounts for countries that do not follow a Monday-to-Friday schedule (e.g., Sunday-to-Thursday). | Status changes to **🔴 Red** if the slot falls on a non-standard rest day. |

---

## 4. Concrete Usage Examples (Scenarios) 🎯

### Scenario 1: Maximizing the Equity Score (Optimal Search)

* **The Challenge:** Scheduling a 60-minute project launch meeting with participants in **Paris, New York, Sydney, and Shanghai**.
* **The Pitfall (4:00 PM CET):** 4:00 PM CET puts Sydney at 1:00 AM (🔴 Red) and Shanghai at 11:00 PM (🔴 Red). **Equity Score 65/100 (Low)**.
* **The GPP Solution:** The tool suggests **10:00 AM CET**. This puts New York at 4:00 AM (🔴 Red), but places Sydney at 7:00 PM (🟠 Orange) and Shanghai at 5:00 PM (🟠 Orange).
* **Conclusion:** **Equity Score 88/100 (Optimal)**. GPP recommends the fairest compromise, minimizing the number of people working in the middle of the night.

### Scenario 2: Respecting Local Specifics (The Holiday Trap)

* **The Challenge:** A manager (London, GMT) plans a review meeting for **Monday, May 25th**, with a key participant in the **United States**.
* **The Pitfall (3:00 PM GMT):** Without GPP, the time is 10:00 AM EST for the US (🟢 Green).
* **The GPP Alert:** The tool recognizes that May 25th is **Memorial Day** in the United States. The US participant's status automatically changes to **🔴 RED**.
* **Conclusion:** GPP prevents a major professional misstep and ensures the US participant's time off is not interrupted by moving the meeting to Tuesday, where all are available (🟢 Green).

---

## 5. Specifications


# 📑 Formal Product Specifications: Scheduling Assistant

## 1. Entity and Data Model 💾

| Entity | Key Attribute | Description | Data Source |
| :--- | :--- | :--- | :--- |
| **P_Participant** | Participant\_ID | Unique identifier. | User Input / External System |
| | P\_Timezone | IANA Timezone (e.g., Europe/Paris). | User Input |
| | P\_Country | ISO 3166-1 Country Code (e.g., FR, US). | User Input |
| **R_Meeting** | R\_Organizer | Participant\_ID of the organizer. | System |
| | R\_Participants | List of Participant\_IDs. | User Input |
| | R\_ProposedDateTime | Date and time in the organizer's timezone. | User Input |
| **C_CountryConfig** | C\_Country | Country Code. | Database (DB) / Configuration |
| | C\_GreenRange [Start/End] | Local optimal working hours (e.g., 09:00 - 17:00). | DB / User Override |
| | C\_OrangeRange [Morning/Evening] | Local acceptable hours (e.g., 08:00 - 09:00 and 17:00 - 18:00). | DB / User Override |
| | C\_Holidays | List of national holiday dates for the current year. | External DB |
| | C\_WorkWeek | Standard working days (e.g., MON-FRI). | DB / User Override |

---

## 2. Functional Requirements (User Stories) ✨

### US-001: Time Input and Conversion

* **As an Organizer**, I want to be able to enter a time in my timezone, **so that** the tool immediately converts that time into the local timezone of every participant.

### US-002: Color Status Display

* **As an Organizer**, I want the tool to display a **🟢/🟠/🔴** status for each participant, **so that** I can instantly visualize their level of comfort/disruption.

### US-003: Optimal Suggestion (Visualizer)

* **As an Organizer**, I want the tool to generate a "Heatmap" graph of the day, **so that** I can quickly find the time slots with the best global "Equity Score."

### US-004: Critical Event Alert

* **As an Organizer**, I want the system to clearly alert me if the proposed time falls on a **National Holiday, a non-standard Weekend, or a Leave period** for any key participant.

### US-005: Range Customization

* **As an Administrator/Organizer**, I want to be able to override the default hourly ranges (Green/Orange) for specific countries, **so that** I can account for clients' cultural specificities.

---

## 3. Business Rules and Logic (The Scheduling Assistant Core) ⚙️

### RM-010: Color Status Determination

**Condition (C) $\implies$ Result (R)**

| Condition | Priority Rule (P) | Color Status |
| :--- | :--- | :--- |
| **C1** : Local Time is a **National Holiday** (per C\_Holidays) OR **Rest Day** (per C\_WorkWeek). | P1 (MAX) | **🔴 RED** |
| **C2** : Local Time is **outside** the Orange Range (C\_OrangeRange). | P2 | **🔴 RED** |
| **C3** : Local Time is **within** the Orange Range (C\_OrangeRange). | P3 | **🟠 ORANGE** |
| **C4** : Local Time is **within** the Green Range (C\_GreenRange). | P4 (MIN) | **🟢 GREEN** |
| **Note:** Condition checks MUST be executed in the order P1 > P2 > P3 > P4. | | |

### RM-020: Global Equity Score (GES) Calculation

The Global Equity Score (GES) is a normalized value between 0 and 100.

1.  **Point Assignment:**
    * **🟢 GREEN** Status: **+10 points**
    * **🟠 ORANGE** Status: **+5 points**
    * **🔴 RED** Status (Standard): **-15 points**
    * **🔴 RED** Status (Holiday/Weekend - Critical Penalty): **-50 points** (applied to the participant's score)

2.  **Calculate Raw Score (RS):** Sum of the points assigned to each participant.

3.  **Calculate Maximum Possible Score (MS):** Total number of participants multiplied by 10 (all participants are GREEN).

4.  **GES Formula:** $$GES = \frac{RS + ((\sum Participants) \times 50)}{(MS + ((\sum Participants) \times 50))} \times 100$$
    * *Note:* The offset of +50 and double normalization are used to prevent negative scores and heavily weigh Critical REDs.

### RM-030: Default Time Ranges

* **Default (All Configurations):** Green Range = 09:00-17:00, Orange Range = 08:00-09:00 and 17:00-18:00.
* **Override:** If an entry exists in **C\_CountryConfig** for the participant's country, the **C\_GreenRange/Orange** values MUST be used instead of the default values.
