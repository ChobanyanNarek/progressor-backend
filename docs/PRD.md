Source: Google Doc https://docs.google.com/document/u/2/d/1BWTQiGnGKjlwH7OBygByyqsyXggywpUlITwn12H5G58/edit · imported 2026-05-14

# 1\. Executive Summary  

# **1. Executive Summary**

## **What the product is**

**MyGhostSpot** is a location-based mobile product that lets users discover and experience digital “memory points” tied to real-world places through augmented reality. In the first iteration, the product is focused on **cemetery and memorial storytelling**: a visitor arrives at a physical memorial location, opens the app, and views AI-generated content, such as an animated memorial video and/or AI avatar experience, anchored to that exact place in AR. The service is supported by a **Central API**, a mobile app for visitors and creators, an admin web interface, D-ID for AI media generation, Google ARCore for AR rendering, Google Maps for geolocation and map visibility, and a cloud-hosted backend/data layer.

## **Who it is for**

The first releasable version serves three clearly distinct user roles:

**1. Visitors****  
** People who visit a cemetery or memorial place and want to view memory points, hear or watch the associated story, and explore the location through a map and AR interface.

**2. Creators****  
** Authorized users who log into the mobile app with a pre-created email and password, physically go to a location, and create or place memory points on the map. They are responsible for tying content to real coordinates.

**3. Admins****  
** Back-office users working through the web interface who manage creators, support content operations, configure D-ID-related parameters, and oversee memory point data and generated AI assets.

## **What core problem it solves**

MyGhostSpot solves the gap between **static memorial information** and **immersive, place-based remembrance**. Traditional genealogy sites, archives, plaques, and grave markers may preserve facts, but they do not create a strong emotional connection between the person’s story and the exact place where remembrance happens. MyGhostSpot turns a passive visit into an interactive digital experience by linking media, AI-generated storytelling, and AR presentation to a precise physical location. The concept is especially aimed at making memorial spaces more meaningful and accessible to younger generations who are comfortable with smartphone-based experiences.

## **What makes it different**

MyGhostSpot is differentiated by the combination of five elements in one coordinated product experience:

**1. Real-world location anchoring****  
** The content is not generic digital media. It is attached to a specific place and becomes meaningful in context.

**2. AI-generated memorial representation****  
** Source material such as old portraits, photos, video, and written narrative is processed into AI-generated outputs. Based on your clarification, the intended output can include **both**:

  - AI-generated video
  - AI avatar / agent-style output

This expands the experience beyond static playback into potentially richer narrative interaction over time.

**3. Mobile-first on-site experience****  
** The experience is designed primarily for use in the field, at the actual site, through the phone’s location, camera, and AR capabilities.

**4. Controlled publishing model****  
** Content creation is intentionally restricted. Visitors do not register. Creators cannot self-register. Admin creates creator accounts with email/password, which reduces uncontrolled map publishing and keeps memory point creation curated.

**5. Map visibility beyond the app****  
** Memory points are not only part of the in-app discovery flow. Based on your direction, creator-added memory points should also appear on **Google Maps**, which materially increases discoverability and links the experience to familiar mapping behavior.

## **Strategic interpretation of the first releasable version**

The architecture is labeled as **intermediate / pre-service**, which indicates an early operational structure designed to validate the product’s core loop rather than a fully mature platform. In practical terms, version 1 should be treated as a **focused pilot-grade product** that proves the following:

  - authorized creators can log into the mobile app and place valid memory points at real locations
  - those points can be linked to uploaded memorial content and D-ID generated AI assets
  - admins can manage the operational setup through the web interface
  - visitors can discover points on a map, approach them physically, and experience them in AR
  - the same points can also be surfaced through Google Maps for broader visibility

This means the first release should not be positioned as a broad open publishing platform. It is better defined as a **controlled memorial AR experience platform**, with curated creator access, admin oversight, mobile-led point creation and viewing, and AI-powered media linked to location. That framing is both more realistic for delivery and more consistent with the current architecture and testing-oriented scope.

## **Confirmed product decisions incorporated into this block**

The following product rules are now treated as confirmed inputs for the next blocks:

  - Product name: **MyGhostSpot**
  - Domain: **myghostspot.com**
  - Roles: **visitor, creator, admin**
  - Visitor access: **no registration / no login**
  - Creator access: **email + password only**
  - Creator accounts: **created by admin**
  - No Apple login
  - No Google login
  - Mobile app: used by **visitors and creators**
  - Web interface: used by **admin only**
  - Creator adds memory points through the **mobile app**
  - Memory points created by creators should appear on **Google Maps**
  - UserView in the architecture should be interpreted as a **specific mobile app screen**
  - Privacy/moderation standards are out of scope for the current testing version

  
  

# 2 Product Vision  

# **2. Product Vision**

### **2.1 Product purpose**

**MyGhostSpot** is intended to turn a real-world memorial location into a digital storytelling touchpoint. The product combines location, AI-generated media, and AR presentation so that a person standing at a grave, memorial stone, or other remembrance point can access a more human, contextual, and emotionally engaging story than what a physical marker alone can provide. The source materials position the first iteration specifically around cemetery use, with animated portraits, AI-generated video, and avatar-based storytelling tied to exact coordinates.

At a strategic level, the product is not just an AR viewer. It is a **location-based memory delivery platform** that:

  - anchors memorial content to a physical place
  - transforms archival material into consumable digital experiences
  - creates a bridge between remembrance, local history, and modern mobile behavior
  - allows a controlled set of authorized creators to publish experiences while visitors consume them frictionlessly

### **2.2 Main user value**

The main value proposition is different for each role, but all roles are connected by the same product promise: **make memory points discoverable, meaningful, and experientially rich in the exact place where they matter**.

|  |  |
| :-: | :-: |
| **User role** | **Primary value** |
| Visitor | Discover nearby memory points and experience stories, voices, and visual presence in context |
| Creator | Place a memory point at a real location and connect it to curated media and AI-generated output |
| Admin | Control who can create content, manage the operational setup, and support a consistent test deployment |

For visitors, the value is immediacy and emotional context. Instead of reading only a name and date, they can access a more vivid representation of the person, including how they looked, what they may have wanted to say, and why they mattered. The Estonian product description explicitly frames this as a way to help younger generations connect with ancestors and treat memorial visits as meaningful journeys rather than passive obligations.

For creators, the value is the ability to turn a physical point into a digital point of memory without needing to build separate technical infrastructure. The technical description makes clear that the service is meant to capture a location in mobile, store it centrally, and then connect it with AI-generated assets and associated memory point data.

For admins, the value is control. In this version, creators do not self-register, and visitors do not log in. That supports a curated testing model and reduces the risk of uncontrolled public publishing.

### **2.3 Core concept of “ghost spots” / memory points**

The core product object is the **memory point**, which can also be understood as the commercial and experiential meaning of a “ghost spot.”

A memory point is not just a map pin. It is a structured digital object that combines:

  - a real geographic location
  - visual or textual source material
  - generated AI output such as a video and/or avatar experience
  - retrieval logic that determines when and how the point becomes visible or playable
  - AR presentation logic that overlays the asset in the camera view
  - ownership and management information connected to creator/admin operations

In product terms, a ghost spot is therefore best defined as:

**A location-anchored digital memory experience that becomes visible in mobile when the user is at or near the designated physical place.**

That concept is consistent across the materials:

  - the product is tied to specific geography
  - the point is enriched by AI-generated media
  - the mobile device retrieves and presents it through AR
  - the point can be discovered through mapping, QR-based entry, and on-site navigation

### **2.4 Why mobile is central to the experience**

Mobile is the center of the product for functional, experiential, and commercial reasons.

#### **Functional reason**

The core flow depends on device-native capabilities:

  - GPS / location services
  - camera access
  - AR rendering
  - network-based retrieval of media and metadata
  - movement through physical space toward a target point

The technical description explicitly states that the mobile application captures memory points using AR and GPS data and later renders service-related objects through Google ARCore using the phone’s location and camera.

#### **Experiential reason**

The product only delivers its full value **in situ**, meaning at the actual place. A memorial experience anchored to a grave or remembrance point is fundamentally stronger when discovered and consumed on-site. The mobile phone is the natural device for that because it travels with the user and provides the live camera layer needed for AR. The concept document also describes the visitor journey through QR-driven app acquisition, map-based discovery, camera activation, and media loading when the user reaches a defined distance threshold.

#### **Behavioral reason**

The target audience, especially younger users, is already accustomed to mobile-first interaction, map navigation, camera-led interfaces, and lightweight digital discovery. The source material explicitly frames the product as a service suited to modern users and smart-device usage patterns.

#### **Product-strategy reason**

Mobile also acts as the point of convergence between:

  - discovery
  - location validation
  - AR consumption
  - creator-side placement of memory points
  - future repeat engagement

That makes the mobile app the primary product surface, while the admin web layer remains a support and operations layer rather than the main customer-facing experience.

### **2.5 Product vision implications for design and development**

This vision leads to several immediate design and build implications:

1.  **The app must feel location-aware from the first screen****  
    ** Map, nearby points, and contextual entry should dominate the experience.
2.  **AR must be useful, not decorative****  
    ** The AR layer should clearly help the user understand where the memory point is and how to view it.
3.  **Creation must be controlled and field-usable****  
    ** Since creators place points through mobile, the creator flow must work reliably outdoors and with imperfect connectivity.
4.  **The backend must treat memory points as composite records****  
    ** A point is not just coordinates. It includes media, AI outputs, ownership, and display metadata.
5.  **Google Maps presence should be treated as a distribution channel****  
    ** Since creator-added points should also appear on Google Maps, publishing and synchronization logic becomes part of the product value, not a side task.

### **2.6 Working product vision for the team**

For founders, designers, and developers, the most actionable version of the vision is:

**Build a controlled, mobile-first memorial AR product where authorized creators place memory points at real locations, admins manage the ecosystem, and visitors discover and experience AI-generated memorial content without needing to sign up.**

That statement is specific enough to guide:

  - MVP scoping
  - mobile IA and navigation
  - API design
  - D-ID integration design
  - creator workflow decisions
  - Google Maps and ARCore implementation priorities

  
  

# 3\. Target Users and Use Cases  

# **3. Target Users and Use Cases**

### **3.1 User model**

Based on the source materials and your product clarifications, MyGhostSpot has a deliberately controlled three-role model:

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Role** | **Access model** | **Main goal** | **Main device** |
| Visitor | No registration, no login | Discover and experience memory points | Mobile app |
| Creator | Pre-created account, email + password | Place and manage memory points in the field | Mobile app |
| Admin | Internal access | Manage creators, content operations, and system setup | Web interface |

This role split is important because the product is **not** an open publishing platform in v1. Discovery is public and low-friction, while creation is permissioned and operationally controlled. That is consistent with the source concept of frictionless visitor usage and controlled management of memory-point content and AI configuration.

## **3.2 Primary user groups**

### **A. Visitors**

Visitors are the main consumer audience of the product. They include:

  - family members visiting graves or memorial points
  - younger generations with limited knowledge of their ancestors
  - tourists or casual passers-by in a memorial area
  - people who receive a shared link or arrive through a QR code at the location

The concept document explicitly describes an end-user who comes to the cemetery, scans a QR code, installs the app, accepts camera/location/data permissions, sees memory points on a map, approaches a point, and then consumes the media in AR when within a defined proximity. Login is not required for this role.

**What visitors want**

  - find meaningful points nearby
  - understand who the memorialized person was
  - consume the story quickly and intuitively
  - experience something more emotionally engaging than a static inscription
  - do this without account creation friction

### **B. Creators**

Creators are authorized field users who place and maintain memory points. In your clarified model, they use the **mobile app**, not a separate web self-service portal. They log in with credentials created by admin and set the points on the map. Their job is not just to upload content, but to create the spatial anchor that makes the experience work.

Typical creator profiles may include:

  - cemetery staff
  - local history society representatives
  - project curators
  - designated memorial content owners
  - pilot-program operators

The technical description supports the idea that the mobile application captures memory points as geographic coordinates and related spatial data, then saves them through the Central API.

**What creators want**

  - log in securely with pre-approved credentials
  - place a memory point accurately while on-site
  - attach or reference the right media/content package
  - verify that the point appears in the app and on Google Maps
  - update, fix, or remove points if needed

### **C. Admins**

Admins operate the system from the web interface. Their role is operational, not experiential. They support the mobile product by managing creator accounts, configuring D-ID-related parameters, handling uploaded files (anchored files by creator) for AI generation, and managing stored memory-point records and linked assets. The technical document states that the web application is the administrative interface for managing user data, configuring AI avatars, and managing memory points and saved data.

**What admins want**

  - create creator accounts
  - manage memory-point records centrally
  - organize source material for AI generation
  - connect generated outputs to the correct memory point
  - maintain data quality during the test phase

## **3.3 Real-world usage scenarios**

### **Scenario 1: Visitor arrives at a cemetery and discovers nearby memory points**

A visitor enters the cemetery and sees a QR code at the entrance or learns about the app from another source. They open or install MyGhostSpot, allow location and camera access, and land on a map showing memory-point markers. They walk toward a selected point. When close enough, the app loads the associated media and opens the AR view so the person can watch or listen to the memory content in context. This flow is directly described in the concept process.

### **Scenario 2: Visitor explores an ancestor’s grave with a richer emotional layer**

A younger family member visits a grave but knows little about the deceased relative. Instead of only seeing a name and dates, they access an AI-generated story, portrait animation, or avatar-like representation that explains who the person was, what they valued, and what memory should be passed on. This is one of the clearest value propositions in the Estonian document.

### **Scenario 3: Creator physically places a new memory point**

An authorized creator visits a grave or memorial stone, opens the mobile app, logs in with email/password, and uses the device’s location and spatial data to place a new memory point accurately. The record is saved through the Central API, linked to the correct content package, and later surfaced both in MyGhostSpot and on Google Maps. This scenario is strongly supported by the technical architecture and your clarified operating model.

### **Scenario 4: Admin prepares AI-ready content for a memory point**

An admin uses the web interface to manage uploaded portrait/photo/video assets by creators, add narrative text and other training material, configure D-ID-related parameters, and connect the generated output back to the correct memory point. This reflects the role of the web admin layer in the technical description.

### **Scenario 5: Visitor chooses lighter media consumption**

When the visitor gets within the activation distance, the app may offer a choice between full media download and audio-only playback. This is useful when the user has weaker connectivity, limited patience, or simply wants a faster experience. That option is explicitly mentioned in the product concept process.

### **Scenario 6: Visitor discovers memory points through Google Maps**

A user sees a memory point surfaced through Google Maps, navigates to the location, and then uses MyGhostSpot to experience the full AR layer and AI-generated content. This is not fully spelled out in the PDFs as a consumer journey, but the materials do say map links are generated for activated coordinates, and you confirmed that creator-added memory points should appear on Google Maps.

**Assumption:** in v1, Google Maps acts as a visibility and navigation channel, while the immersive experience remains inside the MyGhostSpot app.

## **3.4 Main jobs-to-be-done**

### **Visitor jobs-to-be-done**

|  |  |
| :-: | :-: |
| **Job** | **Why it matters** |
| Find closest memory points near me by showing the direction | Discovery is the entry point to the experience |
| Find memory point by name | The product must allow to find specific person by pointing in which direction to go and how many meters |
| Let me view the story in context through AR | The place-based experience is the key differentiator |
| Let me use the app without creating an account | Visitor friction must stay low |
| Let me consume content even with imperfect connectivity | Outdoor memorial spaces may have inconsistent network quality |

These jobs are grounded in the concept of map-based approach, distance-based media retrieval, and low-friction visitor usage.

### **Creator jobs-to-be-done**

|  |  |
| :-: | :-: |
| **Job** | **Why it matters** |
| Help me place a memory point accurately at a real site | The whole service depends on location accuracy |
| Let me log in securely and use only the authorized creator functions | Creation must remain curated |
| Let me connect the right point to the right memorial content | Poor linkage breaks the user experience |
| Let me confirm that the point is visible in the product ecosystem | Creators need confidence that publication succeeded |
| Let me correct, update or delete a point later | Field-created data will require adjustments |

These jobs follow from the technical description that mobile captures memory points and sends spatial and user data to the Central API.

### **Admin jobs-to-be-done**

|  |  |
| :-: | :-: |
| **Job** | **Why it matters** |
| Help me create and manage creator accounts | Publishing control is central to the operating model |
| Let me manage memory points and linked assets centrally | The backend needs operational stewardship |
| Let me manage uploaded files (anchor files) by creator and configure content for D-ID generation | AI output depends on admin preparation |
| Let me connect generated output to the right memory point | This is core to content integrity |
| Let me monitor basic system health and content readiness | Pilot execution depends on operational visibility |

These jobs are directly supported by the technical role of the web application.

## **3.5 User priorities by release logic**

### **Highest-priority users for MVP**

1.  **Visitors****  
    ** Because the product must prove that the experience is valuable and understandable on-site.
2.  **Creators****  
    ** Because no memory points exist without a creator workflow that works in the field.
3.  **Admins****  
    ** Because the controlled publishing model depends on back-office account and content management.

### **Lower-priority audiences for later commercialization (post MVP)**

  - family self-service publishers
  - museum or tourism operators
  - broader heritage ecosystem partners
  - social sharing or community-driven usage

**Assumption:** these secondary audiences should influence architecture and extensibility, but should not drive v1 UX complexity.

## **3.6 Practical implications for UX and product design**

The target-user model has several direct design consequences:

1.  **Visitor UX must optimize for immediate comprehension****  
    ** No login, minimal setup, map-first discovery, simple AR entry.
2.  **Creator UX must optimize for accuracy and trust****  
    ** The app must clearly confirm where the point is being placed and what content it is linked to.
3.  **Admin UX must optimize for operational control****  
    ** The web interface does not need consumer polish first. It needs clear workflows, reliable linking, and auditability.
4.  **Role separation must be explicit in the product****  
    ** Visitor and creator capabilities should not be mixed ambiguously in navigation.
5.  **Outdoor use conditions matter****  
    ** The creator and visitor experiences must both tolerate movement, glare, unstable connectivity, and imperfect GPS precision.

## **3.7 Product interpretation summary for this block**

MyGhostSpot is best understood as a **curated three-sided memorial AR product**:

  - **visitors consume**
  - **creators place and maintain**
  - **admins control and prepare**

That role architecture is strategically sound for a pilot because it keeps visitor adoption easy, prevents uncontrolled publishing, and makes operational testing manageable.

  
  

# 4\. Product Scope Overview  

# **4. Product Scope Overview**

### **4.1 Scope framing**

For the first releasable version, **MyGhostSpot** should be scoped as a controlled memorial-location product with a strong mobile core and a small but capable operational backend. The source materials describe a system where the **Central API** acts as the hub between mobile, web admin, D-ID, Google ARCore, Google Maps, and the data layer. The practical purpose of version 1 is to let authorized creators place memory points, let admins manage the supporting content and accounts, and let visitors discover and experience those points on-site without login.

This means the scope should not be treated as a generic open AR platform in MVP. It should be treated as a **curated, test-ready location-based experience system**.

## **4.2 Scope split by product area**

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Product area** | **Role in the product** | **MVP priority** | **Notes** |
| Mobile app | Primary experience for visitors and creators | Critical | Core product surface |
| Web/admin panel | Admin-only operational control layer | Critical | Supports creators, AI setup, and content ops |
| Backend / Central API | System orchestration, business logic, integration layer | Critical | Most important non-UI component |
| External integrations | AR, maps, AI generation | Critical | Required for product differentiation |
| Data / storage layer | Persistent storage, retrieval, asset linkage | Critical | Must support both app and admin workflows |

## **4.3 Mobile app scope**

### **Purpose**

The mobile app is the main product surface. It supports **two distinct modes of use**:

  - **visitor mode** without login
  - **creator mode** with admin-issued email/password login

The technical document positions the mobile application as the interface for capturing memory points with AR and GPS data, and the concept document positions it as the visitor-facing map and AR experience.

### **In-scope responsibilities**

The mobile app should cover the following scope in v1:

|  |  |
| :-: | :-: |
| **Mobile scope area** | **What it includes** |
| Visitor discovery | Open app, view map, see available memory points, select a point |
| On-site experience | Navigate to point, enter camera/AR mode, retrieve and play associated content |
| AR presentation | Overlay AI video / avatar media at the real-world location using ARCore |
| Proximity logic | Detect when user is close enough to trigger content retrieval |
| Basic media controls | Play, pause, audio-only option where supported, retry loading |
| Creator authentication | Email/password login for approved creators |
| Creator point placement | Capture GPS location and place a new memory point in the field |
| Creator point editing | Update point details, coordinates, and linked content references where allowed |
| UserView | Dedicated mobile screen for viewing memory point details / presentation state |
| Google Maps linkage | Show map positioning and support visibility / linking to Google Maps |

### **Out of scope or limited in MVP**

Based on your clarification and the source limitations, the following should be minimized or excluded in v1:

  - public user registration
  - social features
  - open community publishing
  - advanced notification systems
  - privacy/governance modules beyond basic secure handling
  - complex creator collaboration workflows
  - sophisticated offline authoring beyond light resilience

### **Product interpretation**

The mobile app is not just a viewer. It is both:

  - the **consumption product** for visitors
  - the **field tool** for creators

That dual role is central to scope and will affect navigation, permissions, and role-based feature access.

## **4.4 Web/admin panel scope**

### **Purpose**

The web interface is an **admin-only back-office environment**. It is not a public or creator self-service portal in the updated product model. Its role is to support operational control over the mobile experience.

The technical description explicitly states that the web application is the administrative interface for managing user data, uploading content, configuring AI avatars, and managing memory points and saved data.

### **In-scope responsibilities**

|  |  |
| :-: | :-: |
| **Web/admin scope area** | **What it includes** |
| Admin authentication | Secure access for internal operators |
| Creator account management | Create creator accounts with email/password, reset credentials, disable access |
| D-ID configuration | Configure generation parameters and manage AI-generation inputs |
| Content operations | Handle uploaded memory points and videos by creator (anchor points), and other source materials used for AI generation by D-ID. |
| Memory point management | View, edit, delete, refresh, and maintain point records |
| Asset linking | Attach generated AI outputs to the correct memory point |
| Operational review | Check point readiness, asset availability, and basic status tracking |
| Basic logs / diagnostics | Visibility into failed generation, broken links, and sync issues |

### **Clarified scope boundary**

Admin should manage the system, not create the core field coordinates from a desk-first workflow. Based on your corrected model, **creator mobile flow owns point placement**, while web admin owns control and support functions.

### **Assumption**

**Assumption:** admin may still need a map-based review screen in web to inspect existing memory points spatially, even if actual point creation happens in mobile.

## **4.5 Backend / Central API scope**

### **Purpose**

The Central API is the orchestration and business-logic core of MyGhostSpot. Both documents and the architecture place it at the center of all communication. It should expose a clean service layer for mobile, admin web, D-ID integration, and map/AR-related data retrieval.

### **In-scope responsibilities**

|  |  |
| :-: | :-: |
| **Central API scope area** | **What it includes** |
| Authentication services | Validate admin and creator credentials, issue sessions/tokens |
| Role-based authorization | Separate visitor, creator, and admin capabilities |
| Memory point CRUD | Create, update, retrieve, delete memory points |
| Location handling | Store coordinates, proximity parameters, map metadata, and AR placement data |
| Media metadata management | Store references to uploaded assets and generated outputs |
| D-ID orchestration | Send generation requests, receive results, store result references |
| Mobile retrieval APIs | Return nearby points, point details, AI asset info, and UserView data |
| Google Maps support | Prepare and expose location data needed for map rendering and Google Maps linkage |
| Sync and status handling | Manage generation states such as draft, processing, ready, failed |
| Audit / logging | Track key system actions for debugging and pilot operations |
| Scalability readiness | Support initial modest concurrency with room for extension |

### **Why it matters**

Without a robust Central API, the product becomes a fragile set of disconnected workflows. The architecture makes clear that this layer is the product backbone and should be treated as a first-class workstream, not a thin transport layer.

## **4.6 External integrations scope**

### **A. D-ID API**

D-ID is the AI-generation service that turns source material into AI video and avatar-related output. The technical material states that D-ID receives photo, text, behavioral, and training data and returns AI-based video animation and AI avatar stream outputs.

**In-scope for MVP**

  - submit source content for generation
  - receive generated result
  - store generation status and asset reference
  - link output to a memory point

**Assumption:** real-time conversational agent behavior may exist conceptually, but v1 should still prioritize stable generation and playback over advanced live dialogue complexity unless already technically validated.

### **B. Google ARCore**

ARCore is the mobile AR engine used to place and overlay the AI content in the real-world camera view. The technical document explicitly assigns AR visualization to ARCore.

**In-scope for MVP**

  - camera-based AR scene
  - anchor media to a real-world point
  - align avatar/video presentation to memory-point location
  - support user viewing in outdoor conditions

### **C. Google Maps**

Google Maps supports geotagging, map-based discovery, and location representation. Both the technical and concept documents connect the service to map-linked coordinates. The concept document also states that map links are generated from activated coordinates.

**In-scope for MVP**

  - in-app mapping support
  - display of memory point positions
  - route or open-in-maps behavior
  - creator-added points appearing on Google Maps, per your product clarification

### **Integration scope summary**

|  |  |
| :-: | :-: |
| **Integration** | **MVP role** |
| D-ID | Generate AI video and avatar output |
| Google ARCore | Render memory-point content in AR |
| Google Maps | Display, locate, and distribute memory-point locations |

## **4.7 Data / storage layer scope**

### **Purpose**

The data layer must persist the full state of the product, not just coordinates. The architecture image shows **Database** and **UserView** in the data-flow area, while the technical description states that memory-point data and associated user information are stored centrally and later retrieved for mobile use.

### **In-scope data responsibilities**

|  |  |
| :-: | :-: |
| **Data layer scope area** | **What it includes** |
| User records | Admins, creators, and role-linked access data |
| Memory point records | Coordinates, titles, descriptions, status, ownership |
| Media asset records | Original files, thumbnails, previews, references, optional upload D-ID output files to be used after in combination with memory points |
| AI asset records | D-ID outputs, generation metadata, playback references |
| AR metadata | Placement parameters, display mode, trigger distance |
| Map metadata | Visibility data, map links, Google Maps publishing reference |
| Operational state | Draft, active, inactive, processing, failed |
| Logs / diagnostics | Generation history, update history, sync outcomes |
| UserView support data | Data projection optimized for the mobile viewing screen |

### **Clarification on UserView**

Per your correction, **UserView is a specific mobile screen**, not an independent backend platform in product terms.  
 **Interpretation:** the architecture label likely refers to a view-oriented presentation/data-access layer that supports what the user sees in that mobile screen.

### **Assumption**

**Assumption:** media binaries themselves should be stored in object storage, while the database stores metadata, relationships, and retrieval references.

## **4.8 MVP scope boundary by responsibility**

### **What absolutely must exist in v1**

|  |  |
| :-: | :-: |
| **Must-have area** | **Why** |
| Visitor map discovery | Core entry to the experience |
| Visitor AR playback | Core differentiator |
| Creator login | Required for controlled publishing |
| Creator point placement in mobile | Required to create usable memory points |
| Admin creator-account management | Required for operating model |
| Admin content and AI setup | Required to attach meaningful content |
| Central API orchestration | Required for all app and admin workflows |
| D-ID integration | Required for AI-based media generation |
| Google Maps integration | Required for location logic and visibility |
| Data persistence | Required for every product function |

### **What can remain lightweight in v1**

|  |  |
| :-: | :-: |
| **Lightweight area** | **Recommendation** |
| Analytics | Basic event logging only |
| Moderation | Minimal internal controls only |
| Search sophistication | Basic map and point lookup only |
| Notifications | Omit unless there is a direct pilot use case |
| Advanced creator asset workflows | Keep simple and guided |
| Multi-language support | Add later unless contractually needed |

## **4.9 Scope conclusion**

MyGhostSpot v1 should be scoped as **one mobile-centered product supported by one admin web layer and one orchestration backend**. The correct scope is not "build everything around AR." The correct scope is:

  - let creators place trustworthy memory points in the field
  - let admins manage the ecosystem and AI content pipeline
  - let visitors discover and experience those points simply and reliably
  - make the experience legible through maps and distinctive through AR

That is the cleanest interpretation of the attached materials and your clarified operating model.  

# 5\. Core User Journey  

# **5. Core User Journey**

### **5.1 Journey overview**

The core MyGhostSpot journey is a closed loop with three participating roles:

1.  **Admin** prepares the operational environment, creator accounts, and AI-generation support
2.  **Creator** goes to the physical location and creates the memory point in the mobile app
3.  **Visitor** later discovers and experiences that memory point on-site through map and AR

This journey is directly supported by the technical description, which defines the Central API as the hub between mobile, web admin, D-ID, Google Maps, and ARCore, and by the concept document, which describes the cemetery visitor flow from app entry to map discovery to proximity-based AR/media playback.

The important product interpretation is that MyGhostSpot is **not** a one-step content publishing app. It is a staged service flow where:

  - point location is established in mobile
  - source materials and AI assets are linked through the controlled backend flow
  - the visitor receives a low-friction consumption experience

## **5.2 End-to-end journey in sequence**

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Stage** | **Primary actor** | **Core action** | **System outcome** |
| 1 | Admin | Create admin account to database with email \<henri.pook@gmail.com\> and password henri1234 | Admin can create Creator account after that |
| 2 | Creator | Logs into mobile app | Creator features become available |
| 3 | Creator | Goes on-site and places memory point | Coordinates and spatial metadata are saved |
| 4 | Creator / Admin | Uploads or links memorial source material | Content package becomes available for processing |
| 5 | Admin | Configures D-ID input / parameters | Memorial material is sent to AI generation by D-ID |
| 6 | System + D-ID | Generates AI video and/or avatar output | AI asset is stored and linked to point |
| 7 | System | Publishes memory point data for retrieval | Point is visible in app and intended to appear on Google Maps |
| 8 | Visitor | Opens app, sees map, approaches location | App retrieves nearby point metadata |
| 9 | Visitor | Reaches activation zone | App loads media and opens AR experience |
| 10 | Visitor | Watches / listens / interacts with the point | MyGhostSpot delivers the core value moment |
| 11 | Creator / Admin | Revises or maintains point if needed | Point remains accurate and usable |

## **5.3 Step-by-step journey detail**

### **Step 1: Admin prepares the ecosystem**

Before any memory point can be created, admin sets up the controlled environment in the web interface.

This includes:

  - creating a creator account with email and password
  - preparing or organizing source materials
  - configuring D-ID-related inputs and generation parameters where needed
  - maintaining the memory-point and asset records in the backend

This is consistent with the technical document, which states that the web application is the administrative interface for uploading files/text, configuring AI avatars, and managing memory points and saved data.

**Product implication:** the system must assume that publishing control starts in admin, not in public registration.

### **Step 2: Creator logs into the mobile app**

The creator opens the same mobile app used by visitors, but accesses a protected creator mode using admin-issued email/password credentials.

Once authenticated, the app should unlock creator-only actions such as:

  - create memory point
  - edit owned or assigned memory points
  - attach or select content package reference
  - publish or submit point status

**Assumption:** visitor and creator experiences should share one app shell but expose different actions based on authentication state and role.

### **Step 3: Creator discovers or selects a physical location**

The creator is physically present at the grave, memorial stone, or other location intended to become a memory point. This is a critical part of the logic in both the concept and technical descriptions. The location is not abstractly assigned from a desk. It is tied to an actual place. The source materials describe physically marking a memorial point and using GPS/spatial data to save it.

The mobile app should allow the creator to:

  - view current position on a map
  - verify the target place visually and geographically
  - drop, confirm, or adjust the memory-point location
  - capture supporting placement metadata if needed

**Product implication:** this is one of the most important workflows in the whole product because inaccurate point placement breaks the later visitor experience.

### **Step 4: Creator captures or defines the memory point**

At the location, the creator creates the memory point record in the mobile app.

The record should include at minimum:

  - point name / title
  - coordinates
  - short description or label
  - point type, such as grave, memorial stone, monument, heritage point
  - ownership or creator attribution
  - status, such as draft, pending content, processing, ready
  - optional media reference if already prepared

The technical document explicitly states that the mobile app marks user memory points as geographical coordinates and related spatial data and saves them to the Central API together with user information.

**Assumption:** for MVP, creators should be able to create the point first, so that location anchoring and content preparation are the first step, and AI media generation from Admin panel is step two.

### **Step 5: Creator uploads data for AI avatar / video generation**

The detailed content-preparation tasks are primarily handled through admin web, but the creator may still need mobile-level actions such as:

  - select which point the content belongs to
  - attach metadata
  - upload a basic image, text, or placeholder package
  - trigger a handoff for admin processing

The Estonian concept describes uploading the deceased person’s photo/video and text, then choosing whether to generate an animated video or AI-based avatar.  
**  
**The point should be created in mobile first, while the more delicate content and AI workflow is finalized in the admin system to reduce field complexity.

### **Step 6: System sends data for AI generation**

Once the source package is ready, the system sends the material to D-ID through the Central API-driven orchestration layer. The technical description states that D-ID receives photo, text, behavioral, and training data and returns AI-based video animation and AI avatar stream results.

At this stage, the system should:

  - validate required inputs
  - create a generation job
  - send the content package to D-ID
  - track generation status
  - receive and store the returned asset reference
  - link the output back to the correct memory point

Possible states:

  - Draft
  - Awaiting AI input
  - Processing
  - Ready
  - Failed
  - Disabled

**Product implication:** the user journey depends on asynchronous processing. AI generation should not be modeled as an immediate in-app action for the visitor-facing experience.

### **Step 7: System stores and links the memory point**

After generation succeeds, the platform stores the connected data set:

  - memory point metadata
  - location and map metadata
  - AI asset reference
  - playback configuration
  - AR placement metadata
  - creator/admin ownership data
  - retrieval-ready state

The technical description explicitly says the Central API stores memory point data linked with user information and later retrieves memory point data, including AI avatar information, for the mobile app.

At this point, the point becomes a publishable object in the system.

### **Step 8: Memory point becomes discoverable in MyGhostSpot and Google Maps**

Once active, the memory point should be surfaced in two places:

**Inside MyGhostSpot**

  - as a map marker
  - in nearby-point retrieval
  - in any point list or UserView entry

**In Google Maps**

  - as an externally visible mapped location, according to your clarified requirement that creator-added points should appear on Google Maps

The concept document states that map links are generated from activated coordinates.

**Assumption:** in MVP, Google Maps support may initially be implemented as location linkage and map visibility metadata rather than deep bi-directional synchronization logic, depending on technical and platform constraints.

### **Step 9: Visitor discovers a memory point**

A visitor enters the experience through one of several entry paths:

  - QR code at cemetery entrance
  - shared link
  - direct app open on-site
  - map-based browsing
  - Google Maps discovery leading into MyGhostSpot

The concept document explicitly describes a QR-code entry point at the cemetery gate and states that login is not required for visitors. It also states that the home screen contains a map with icons leading to AR-animated points.

From a product standpoint, discovery should feel simple:

  - open app
  - allow location and camera
  - see nearby memory points
  - choose one and move toward it

### **Step 10: Visitor approaches the location**

As the visitor moves toward the point, the app should continuously monitor:

  - distance to the memory point
  - device location quality
  - whether the point is eligible for loading
  - whether required media is already cached or needs download

The concept document states that once a defined distance of about **5 meters** is reached, the phone starts downloading the media file, and the user may choose between full file and audio-only.

This implies a clear product behavior:

  - far away: show marker / details / navigate
  - near target: pre-load content
  - in activation zone: enable AR playback

**Product implication:** proximity-triggered loading is a central part of the intended visitor experience and should be handled explicitly in the app flow.

### **Step 11: Visitor retrieves memory point data**

Once near the point, the mobile app requests the enriched memory-point payload from the Central API.

That payload likely includes:

  - point identifier
  - title and summary
  - coordinates and trigger radius
  - AI asset URLs or stream references
  - media type
  - AR placement settings
  - display instructions
  - optional day/night presentation rules

The technical description states that the Central API retrieves memory point data, including AI avatar information, and sends it to the mobile app.

### **Step 12: AR overlay experience begins**

The app opens the AR view using the phone camera and ARCore. The AI avatar and/or video is overlaid in relation to the real-world location of the memory point. The technical document explicitly describes the mobile app using ARCore to overlay AI avatars and videos onto the real-world view aligned with the captured memory point location.

The visitor experience should include:

  - clear indication that the user is in AR mode
  - visible guidance if alignment is not yet stable
  - immediate playback when the asset is ready
  - basic playback controls
  - optional audio-only fallback

The concept document also adds a presentation nuance: daytime display may be more colorful, while night mode may be more translucent.

**Assumption:** for MVP, this visual difference should be treated as a simple presentation rule rather than a major rendering subsystem.

### **Step 13: Visitor consumes the memory experience**

This is the product’s key value moment.

The visitor may:

  - watch the generated memorial video
  - view the avatar presentation
  - listen in audio-only mode
  - read a short supporting text if provided
  - revisit the point details in the dedicated UserView screen

The concept material frames this as a more emotionally engaging way to understand who the person was, how they lived, what they looked like, and what messages they might leave for future generations.

### **Step 14: Revisit, manage, or share if applicable**

After experiencing the point, different follow-up paths apply to different roles.

**Visitor**

  - revisit the point later
  - return to the map
  - open another nearby point
  - optionally share the app or the location

**Creator**

  - update point details
  - move or correct point placement
  - refresh linked asset
  - disable or archive point if needed

**Admin**

  - review content issues
  - replace media and text
  - re-run generation
  - manage creator access

**Assumption:** social sharing should be lightweight or omitted in MVP unless there is a strong pilot requirement.

## **5.4 Journey variants by role**

### **Visitor journey**

1.  Arrive on-site or via shared location
2.  Open app
3.  Accept required permissions
4.  See map of memory points
5.  Walk toward selected point
6.  Enter activation radius
7.  Load media
8.  View in AR
9.  Return to map or continue exploring

### **Creator journey**

1.  Open app
2.  Log in with email/password
3.  Go to physical point
4.  Create or edit memory point
5.  Save coordinates and metadata
6.  Attach or reference content package
7.  Confirm publication readiness
8.  Verify point visibility in app and Google Maps

### **Admin journey**

1.  Log into web admin
2.  Create creator account
3.  Upload or organize source materials
4.  Configure D-ID parameters
5.  Trigger or monitor generation
6.  Link output to memory point
7.  Maintain point status and asset integrity

## **5.5 Key journey design principles**

The journey should be designed around the following principles:

|  |  |
| :-: | :-: |
| **Principle** | **What it means in practice** |
| Low-friction visitor entry | No visitor login, minimal setup, fast map-to-AR flow |
| Controlled creation | Only approved creators can publish points |
| Field-first accuracy | Point creation must work reliably on-site |
| Async AI processing | Generation happens in the background, not inside the visitor session |
| Proximity-based delivery | The experience gets richer as the visitor nears the point |
| Map + AR continuity | Map discovery and AR viewing must feel like one connected experience |

## **5.6 Main edge cases in the journey**

Several edge cases are already implied by the materials and should be accounted for early:

  - creator places a point with weak GPS precision
  - AI generation fails or returns incomplete output
  - visitor reaches point but connectivity is poor
  - user denies camera or location permissions
  - point exists on map but asset is still processing
  - AR alignment is unstable in outdoor conditions
  - Google Maps visibility is delayed or mismatched with app publication state
  - creator accidentally creates duplicate points in the same area

These do not change the core journey, but they should shape the product specification in later blocks.

## **5.7 Product interpretation summary for this block**

The core MyGhostSpot journey is best understood as:

**admin enables -\> creator anchors -\> system generates -\> visitor discovers -\> AR delivers**

That sequence is the operational heart of the product. If any of those stages is weak, the end-user experience degrades. For MVP, the highest priority is to make this loop reliable, understandable, and testable in a real cemetery environment.

  
  

# 6\. Detailed Feature Breakdown  

# **6. Detailed Feature Breakdown**

### **6.1 Scope of this block**

This block translates the product concept into an implementation-oriented feature set. It is structured by module and, for each feature, explains:

  - **what it does**
  - **why it matters**
  - **notes / assumptions**

This is not yet the final MVP cut. It is the full working feature inventory that product, design, and engineering can use for scoping.

## **6.2 Module: Authentication and User Accounts**

### **Product logic**

MyGhostSpot uses a **controlled access model**:

  - **Visitors** do not register and do not log in
  - **Creators** log in with **email + password**
  - **Creator accounts are created by admin**
  - **Admins** use web-admin authentication
  - **No Apple login**
  - **No Google login**
  - **No public registration**

This is a deliberate publishing-control decision, not a limitation.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Visitor guest access | Allows visitors to open the app, browse map content, and experience memory points without authentication | Keeps visitor onboarding friction low and supports spontaneous cemetery use | Core v1 feature |
| Creator email/password login | Allows approved creators to access creator tools in the mobile app | Prevents uncontrolled point creation and keeps publishing curated | Confirmed requirement |
| Admin login to web interface | Restricts admin panel access to internal operators | Protects account-management and system-control functions | Must support secure session management |
| Role-based access control | Shows different features depending on user role: visitor, creator, admin | Prevents accidental exposure of creation/admin capabilities to the wrong users | Visitor and creator live in one mobile app |
| Session persistence | Keeps creator/admin logged in between sessions until logout or expiry | Reduces friction for repeat operational use | Should include token/session expiry rules |
| Logout | Allows creator/admin to end session manually | Basic security and account hygiene | Required |
| Password reset by admin | Lets admin reset creator credentials | Important because there is no self-service account recovery in v1 | Recommended for MVP |
| Account activation / deactivation | Allows admin to enable or disable creator access | Supports controlled testing and user lifecycle management | Required for operational control |
| Audit of login actions | Stores basic login success/failure records | Useful for debugging and test-phase oversight | Keep lightweight in MVP |

**Assumption:** admin account creation and admin password recovery are managed internally, not exposed as public self-service flows.

## **6.3 Module: User Profile**

### **Product logic**

User profile needs are minimal in v1 because:

  - visitors are anonymous
  - creators are assigned accounts
  - admin is operational

The profile model should remain simple.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Creator profile basics | Stores creator name, email, role, status, and assigned organization if relevant | Needed for operational tracking and point ownership | Keep limited in v1 |
| Admin profile basics | Stores admin identity and role | Needed for accountability and access control | Standard back-office feature |
| My created points view | Lets a creator see points they created or manage | Helps creators find and update their own work | Strongly recommended |
| Profile edit by admin | Allows admin to update creator account details | Needed because there is no self-service registration model | Required |
| Account status visibility | Shows active/inactive/disabled status | Reduces confusion when access fails | Useful for support |
| Ownership attribution | Links memory points to creator identity | Needed for traceability and later maintenance | Should exist in backend even if not highly visible in UI |

**Assumption:** creator profile editing inside mobile should be very limited in v1. Most account changes should happen in admin web.

## **6.4 Module: Memory Point Creation**

### **Product logic**

This is one of the most important modules in the entire product. The memory point is the core content object and must be created **in the mobile app by an authenticated creator on-site**.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Create new memory point | Lets creator start a new point record in mobile | Core creation workflow | Critical MVP feature |
| Capture current GPS location | Uses device location to assign coordinates to the point | The whole experience depends on real-world anchoring | Must surface accuracy state |
| Drop point on map | Lets creator confirm or adjust the marker on a map | GPS alone may not be precise enough in cemetery conditions | Important usability feature |
| Save point title / label | Stores a readable name for the point | Needed for discovery, admin management, and map display | Required |
| Save short description | Stores a summary of what the point represents | Improves visitor understanding before entering AR | Recommended MVP |
| Point type classification | Lets creator define type such as grave, memorial stone, monument, heritage object | Improves filtering, admin control, and future search | Recommended |
| Draft save | Saves a point before all content is fully ready | Useful because location capture and AI-content readiness may happen at different times | Strongly recommended |
| Attach content package reference | Links the point to uploaded media or admin-prepared content | Needed to connect location and storytelling asset | Could be a simple selector in v1 |
| Submit point for activation | Marks point as ready for admin review or direct publication depending on workflow | Provides state control | Workflow detail may vary |
| Capture on-site verification photo | Lets creator attach a quick environment photo for admin reference | Helps validate the point and troubleshoot wrong placement | Assumption, useful but optional |
| Save AR placement metadata | Stores initial display orientation/anchor hints if needed | Supports later AR rendering quality | May start simple in MVP |
| Duplicate detection prompt | Warns if another point already exists nearby | Prevents clutter and data-quality issues | Recommended, especially in cemetery clusters |

**Assumption:** v1 should allow point creation even when AI output is not yet ready, using statuses such as Draft, Processing, Ready.

## **6.5 Module: Memory Point Editing / Deletion**

### **Product logic**

Memory points will need correction after field placement. Editing is necessary because GPS, naming, and content linking may not be perfect on first save.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Edit point metadata | Lets creator or admin update title, description, type, and related fields | Real-world data entry always needs adjustment | Required |
| Move point location | Lets creator/admin reposition a point on the map | Corrects GPS inaccuracy or bad initial placement | Very important |
| Update content linkage | Changes which AI/media assets are connected to the point | Needed when regeneration or replacement happens | Required |
| Change publication status | Switches point between draft, active, inactive, failed, archived | Provides operational control | Required |
| Delete point | Removes a memory point from active use | Needed for errors and test cleanup | Hard delete vs soft delete should be defined |
| Soft archive / deactivate | Hides point without fully destroying its history | Safer than deletion in testing | Recommended |
| Edit history log | Stores who changed what and when | Useful for debugging and pilot management | Lightweight audit is enough for MVP |
| Re-run AI generation trigger | Allows creator/admin to trigger regeneration after content update | Important when D-ID output changes | Likely admin-led in v1 |

**Assumption:** full deletion should probably be restricted to admin, while creators can only deactivate or request deletion.

## **6.6 Module: Location Capture and Mapping**

### **Product logic**

This module supports both creation and consumption. It includes accurate point placement, map rendering, route context, and Google Maps exposure.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Live location detection | Detects device location in real time | Needed for navigation, proximity logic, and creator placement | Core feature |
| Accuracy indicator | Shows whether current GPS quality is strong enough for reliable point placement | Prevents bad field data | Important for creators |
| In-app map view | Displays memory points on a map inside MyGhostSpot | Primary discovery surface for visitors | Critical MVP feature |
| Nearby point visualization | Highlights points close to the user | Makes exploration intuitive on-site | Required |
| Point detail from map tap | Opens point preview when a marker is tapped | Connects map browsing to content experience | Required |
| Route / open navigation | Helps user move from current location to selected point | Improves visitor flow in large cemeteries | Could start with open-in-maps behavior |
| Activation radius logic | Defines when content should pre-load or unlock | Central to location-aware experience | Source materials suggest about 5 meters |
| Geofenced media pre-load | Starts fetching media when user nears a point | Improves AR launch speed | Important for usability |
| Creator map placement mode | Specialized map UI for point creation/editing | Needed for accurate publishing | Critical |
| Publish memory points to Google Maps | Makes creator-added points appear on Google Maps as well | Extends discoverability beyond the app | Confirmed requirement |
| Generate Google Maps link | Provides map link for a memory point | Useful for navigation and sharing | Likely easier than full sync at first |
| Cluster handling on dense maps | Prevents overlapping markers in crowded cemetery zones | Important for usability in real environments | Recommended |

**Assumption:** the first version may support Google Maps visibility through structured location publishing and linking before any advanced synchronization tooling.

## **6.7 Module: AR Experience**

### **Product logic**

AR is the signature experience layer, but it should be pragmatic. In v1, AR should focus on **clear, stable presentation of anchored 2D / 2.5D AI media**, not complex 3D interactions.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Enter AR mode | Opens the camera-based AR experience for a selected point | This is the core value moment for visitors | Critical MVP feature |
| ARCore-based rendering | Uses Google ARCore to anchor content in the camera view | Enables place-based immersive viewing | Confirmed architectural component |
| Media overlay at memory point | Places AI video/avatar in relation to the target location | Converts map data into lived experience | Core feature |
| Alignment guidance | Helps the user aim and stabilize the device for correct AR placement | Outdoor AR can be confusing without guidance | Strongly recommended |
| Anchor persistence during session | Keeps the content stable while the user moves slightly | Reduces immersion-breaking jitter | Important for usability |
| Play AI video in AR | Plays a generated memorial video in the AR scene | One of the main output types | Required |
| Display AI avatar in AR | Shows avatar-style generated content in the AR scene | Second main output type | Required based on your correction |
| Audio-only fallback | Allows user to hear content without full AR video if needed | Useful for poor connectivity or device limitations | Mentioned in concept flow |
| Retry / reload in AR | Lets user recover from failed load or broken alignment | Necessary for outdoor reliability | Required |
| Day / night presentation adjustment | Adapts visual treatment for different ambient conditions | Improves readability and atmosphere | Keep simple in MVP |
| Exit AR back to point view | Lets user leave AR without losing context | Basic navigation need | Required |
| Unsupported-device fallback | Detects if device does not support ARCore and offers non-AR viewing | Prevents total feature failure on some devices | Recommended |

**Assumption:** interactive conversational AI inside AR should be deferred unless D-ID and product scope are already validated for a stable real-time flow.

## **6.8 Module: AI Avatar / AI Video Generation**

### **Product logic**

This module covers the operational flow from source content to generated AI output. MyGhostSpot should treat AI generation as **asynchronous** and state-driven.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| AI input package definition | Defines the source materials used for generation, such as image, video, text, and narrative | Required to create meaningful AI output | Primarily admin-managed |
| D-ID generation request | Sends content and parameters to D-ID through the Central API | Core integration with AI generation layer | Required |
| Support for AI video output | Stores and manages generated memorial video | One confirmed output format | Required |
| Support for AI avatar output | Stores and manages avatar-style generated output | Second confirmed output format | Required |
| Generation status tracking | Tracks states such as draft, queued, processing, ready, failed | Needed for operational clarity | Critical |
| Asset-to-point linking | Connects returned AI asset to the correct memory point | Prevents broken visitor experiences | Critical |
| Re-generation flow | Allows output to be recreated after source changes | Essential when the first output is poor | Strongly recommended |
| Parameter configuration | Lets admin control D-ID-related generation settings | Needed for quality and consistency | Mentioned in architecture |
| Preview before activation | Allows admin to review generated output before exposing it to visitors | Important even in a test setup | Recommended |
| Failure handling and fallback | Flags failed generations and allows alternative content | Prevents unusable points | Required |
| Versioned AI asset storage | Keeps track of multiple generated versions over time | Useful for comparison and rollback | Can be lightweight in MVP |

**Assumption:** generation should happen server-side through the Central API, not directly from mobile to D-ID.

## **6.9 Module: Media Upload and Management**

### **Product logic**

Media is the input layer for storytelling and the fallback layer when AI generation is incomplete or replaced.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Upload source image | Uploads portrait or source photo used for memorial representation | Common AI-generation input | Required |
| Upload source video | Uploads base video if available | Supports richer source material | Optional but useful |
| Upload narrative text | Adds memorial text, biography, or script | Important for meaningful output | Required |
| Upload supporting files | Allows additional materials such as archival notes or reference content | Helps improve asset quality | Optional in MVP |
| Media library / asset list | Shows uploaded assets linked to points | Supports admin control and maintenance | Recommended |
| Asset preview | Lets admin review uploaded media before generation | Prevents broken or wrong inputs | Required |
| Replace media asset | Allows updating a source file | Needed when corrections are made | Required |
| Delete media asset | Removes incorrect or obsolete source material | Supports cleanup | Required |
| File validation | Checks file type, size, and minimum quality rules | Prevents bad uploads and failed processing | Important |
| Asset linkage to point | Explicitly connects files to a memory point | Core to content integrity | Required |

**Assumption:** most heavy media management belongs in web admin, while mobile creator flow should remain lightweight.

## **6.10 Module: Viewing and Exploring Memory Points**

### **Product logic**

This is the visitor consumption module outside pure map and AR. It includes preview, detail view, and the dedicated **UserView** mobile screen you clarified.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Nearby points list | Shows available points near the current location | Complements map-based discovery | Recommended |
| Point preview card | Displays a quick summary when user taps a marker | Helps users decide what to explore | Required |
| UserView screen | Dedicated mobile screen for viewing a memory point’s details and experience entry | You confirmed this as a specific app screen | Important named product surface |
| Point metadata display | Shows title, short story, location, and media state | Gives context before AR entry | Required |
| Media-ready indicator | Shows whether the point is ready, processing, unavailable, or out of range | Helps set user expectations | Strongly recommended |
| Start experience action | Launches AR or playback from point view | Connects browsing and experience | Required |
| Revisit recently viewed points | Lets user return to a point they already opened | Improves usability in large locations | Optional but useful |
| Alternative content mode | Provides non-AR or audio-first access where appropriate | Important fallback path | Recommended |
| Continue exploring | Returns user to map after content consumption | Keeps discovery loop active | Required |

**Assumption:** UserView should serve as the bridge between map selection and AR mode, not just a static detail page.

## **6.11 Module: Search / Map Discovery**

### **Product logic**

Search in v1 should be functional, not overbuilt. The primary discovery mode is still the map, but there should be enough finding capability to support real-world use.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Map-first discovery | Uses map markers as the default browsing method | Best fit for location-based experience | Critical MVP feature |
| Search by point name | Lets user find a known memorial point quickly | Useful for directed visits | Recommended |
| Search by nearby area | Filters points around current location | Helps visitors in large sites | Useful |
| Filter by point type | Lets user focus on specific types of memory points | Improves usability as volume grows | Optional in MVP |
| QR-code entry to specific location or app | Lets visitors start the experience from a cemetery QR code | Mentioned in concept flow | Recommended |
| Open from Google Maps context | Supports entry into MyGhostSpot from a Google Maps-discovered point | Important for cross-channel discovery | Confirmed direction |
| No-results state | Explains what to do if no points are nearby | Important for user trust | Required |
| Dense-area marker management | Handles overlapping markers in crowded areas | Likely important in cemetery settings | Recommended |

**Assumption:** advanced semantic search, recommendation, and discovery personalization should be deferred.

## **6.12 Module: Permissions / Privacy**

### **Product logic**

You explicitly said privacy-standard functionality should be skipped for now because the app is being made for testing purposes. Even so, the product still needs baseline permission handling.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Location permission request | Requests access to device location | Required for map, proximity, and creator placement | Critical MVP feature |
| Camera permission request | Requests access to camera for AR | Required for AR experience | Critical MVP feature |
| Media/storage permission if needed | Requests access for upload flows where platform requires it | Needed for creator content actions | Platform-dependent |
| Permission rationale screens | Explains why permissions are needed | Reduces denial rates and confusion | Strongly recommended |
| Graceful permission-denied state | Lets user continue with limited app behavior if a permission is denied | Prevents hard dead ends | Required |
| Basic secure handling of credentials | Protects creator/admin login and session data | Even test products need basic security hygiene | Required |
| Visibility setting placeholder | Prepares data model for future private/public rules | Helps future extensibility | Can be backend-only in MVP |

**Out of scope for current MVP**

  - full privacy-consent framework
  - memorial-rights governance workflows
  - family ownership disputes
  - legal consent tracking
  - advanced personal-data export/delete workflows

## **6.13 Module: Notifications**

### **Product logic**

Notifications are not central to the first product loop and should remain optional.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| AI generation complete notification | Alerts creator/admin when a point’s AI asset is ready | Useful operationally | Nice-to-have, not core MVP |
| Failed generation alert | Notifies admin that content processing failed | Helpful for pilot management | Could be email or admin dashboard instead |
| Nearby point notification | Alerts visitors near a point | Not necessary in v1 and may feel intrusive | Defer |
| Admin account event notifications | Alerts on account changes or access issues | Operationally useful but not essential | Defer or keep internal only |

**Recommendation:** do not prioritize push notifications in MVP. Use in-app status states and admin dashboards first.

## **6.14 Module: Admin / Moderation / Content Management**

### **Product logic**

Even though formal moderation/privacy workflows are not the current focus, admin still needs strong operational control over content and users.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Creator account creation | Admin creates creator accounts with email/password | This is the foundation of the controlled publishing model | Critical MVP feature |
| Creator account disable/enable | Turns creator access on or off | Supports operational control | Required |
| Memory point overview dashboard | Shows all points and their statuses | Helps manage deployment quality | Required |
| Point edit/delete from admin | Lets admin correct or remove problematic records | Needed for system integrity | Required |
| D-ID parameter configuration | Controls generation settings used for AI outputs | Mentioned in architecture | Required |
| Upload and manage source content | Supports preparation of AI input materials | Required for operational workflow | Required |
| Review generated output | Lets admin inspect AI results before or after linking | Important for quality control | Strongly recommended |
| Link AI asset to point | Connects generated content to the correct point | Critical for product correctness | Required |
| Google Maps publication oversight | Lets admin verify point visibility state related to Google Maps | Important because map presence is part of product value | Recommended |
| Basic system logs | Surfaces generation failures, broken assets, and sync errors | Important in testing environment | Required |
| Admin search/filter tools | Helps find points, creators, and assets quickly | Improves operational usability | Recommended |
| Content status management | Tracks draft, processing, ready, failed, inactive | Core to managing asynchronous workflows | Required |

**Clarification:** formal public moderation queues and complex approval hierarchies can be minimal in v1, but admin still needs enough control to keep the pilot stable.

## **6.15 Module: Analytics**

### **Product logic**

Analytics should be basic but intentional. The purpose in v1 is to learn whether the product loop works, not to build a full BI program.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Feature name** | **What it does** | **Why it matters** | **Notes / assumptions** |
| Point view count | Tracks how many times a memory point is opened | Helps evaluate content relevance | Basic MVP analytics |
| AR session start count | Tracks how often users enter AR mode | Measures activation of the core experience | Important |
| AR session completion / drop-off | Tracks whether users complete or abandon the experience | Helps improve UX and content length | Recommended |
| Nearby-point discovery events | Measures how users find points | Useful for map/discovery iteration | Recommended |
| Creator publish events | Tracks point creation and activation | Helps monitor operational throughput | Required for pilot learning |
| AI generation success/failure rates | Tracks reliability of D-ID workflow | Important for technical health | Critical operational metric |
| Device / AR support diagnostics | Tracks unsupported devices and AR failures | Important because AR is hardware-dependent | Recommended |
| Google Maps referral indicator | Tracks whether a user came from Google Maps context if feasible | Valuable because Maps is part of discovery strategy | Nice-to-have |
| Basic admin dashboard metrics | Shows high-level status counts | Useful for day-to-day operations | Recommended |

**Recommendation:** keep analytics event taxonomy small and focused on:

  - discovery
  - approach
  - experience start
  - experience success/failure
  - creation/publish
  - AI processing health

## **6.16 Cross-module feature dependencies**

### **Core dependency map**

Some features only work if several modules are coordinated correctly.

|  |  |
| :-: | :-: |
| **Dependent experience** | **Depends on** |
| Visitor AR viewing | location permissions + map data + point status + media retrieval + ARCore support |
| Creator point publication | creator login + GPS capture + point CRUD + backend save + admin content linkage |
| AI-powered experience | content upload + D-ID configuration + generation status + asset linking |
| Google Maps visibility | valid point metadata + publication logic + map integration process |
| UserView usefulness | point metadata + media status + navigation to AR |

This means engineering should not estimate modules in isolation. Several of the most important user-facing moments are integration moments.

## **6.17 Priority classification by implementation urgency**

### **Must-have for v1**

  - guest visitor access
  - creator login
  - admin creator-account creation
  - create/edit/deactivate memory points
  - map-based point discovery
  - GPS-based point placement
  - AR entry and anchored playback
  - D-ID generation orchestration
  - AI asset linkage to point
  - UserView screen
  - basic Google Maps integration
  - core status states
  - basic analytics and logs

### **Should-have for v1 if feasible**

  - duplicate point warning
  - unsupported-device fallback
  - audio-only fallback
  - point search by name
  - creator “my points” list
  - admin preview of generated assets
  - point movement / coordinate correction tools

### **Later-phase items**

  - push notifications
  - complex moderation/privacy features
  - advanced search/filtering
  - richer social sharing
  - self-service creator onboarding
  - public registration
  - real-time conversational AI agent depth
  - sophisticated personalization

## **6.18 Product interpretation summary for this block**

The detailed feature set shows that MyGhostSpot is not just an AR frontend. It is a coordinated product with five tightly connected capability layers:

1.  **controlled identity and publishing**
2.  **location-based point creation and discovery**
3.  **AI-content preparation and generation**
4.  **mobile AR consumption**
5.  **admin operations and system oversight**

If this feature set is implemented cleanly, the team will have a strong basis for UX flows, technical scoping, and MVP slicing.

  
  

# 7\. Mobile App Functional Specification  

# **7. Mobile App Functional Specification**

### **7.1 Purpose of the mobile app**

The mobile app is the primary product surface of MyGhostSpot. It serves two user modes inside one application:

  - **Visitor mode** for anonymous users who discover and experience memory points without registration
  - **Creator mode** for authorized users who log in with admin-issued email and password to create, place, and manage memory points in the field

This makes the app both:

  - a **consumer-facing AR discovery product**
  - a **creator field tool for spatial publishing**

The mobile app should therefore be designed with a shared shell and role-based capability access, rather than as two separate apps.

## **7.2 Functional goals of the mobile app**

The app should achieve the following product outcomes:

|  |  |
| :-: | :-: |
| **Goal** | **What the app must enable** |
| Discover memory points | Show nearby points on a map and allow users to open them |
| Experience memory points | Let visitors view AI-generated memorial content in AR |
| Place memory points | Let creators create and geolocate points on-site |
| Support content linkage | Let creators connect points to content packages or upload basic materials where permitted |
| Handle real-world context | Work in outdoor conditions with imperfect GPS, variable signal, and mixed device quality |
| Stay low-friction | Keep visitor entry simple and keep creator workflows guided and reliable |

## **7.3 Supported user roles in mobile**

### **Visitor mode**

Visitor mode is the default state of the app.

**Capabilities**

  - open app without account
  - allow permissions
  - view map and nearby points
  - open point details
  - enter AR experience
  - play AI video or avatar content
  - use audio-only or fallback modes if provided

**Restrictions**

  - cannot create memory points
  - cannot edit points
  - cannot upload media
  - cannot access creator/admin management functions

### **Creator mode**

Creator mode becomes available after login.

**Capabilities**

  - everything available to visitors
  - create a memory point on-site
  - edit owned or assigned points
  - move point position
  - attach or reference content package
  - review point status
  - verify publication-related state

**Restrictions**

  - cannot access admin-only web functions
  - cannot create creator accounts
  - should not have unrestricted global system management

## **7.4 Navigation structure**

### **Recommended top-level navigation**

The most practical mobile information architecture for v1 is a **bottom navigation with role-aware entry points**.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| **Navigation item** | **Visitor** | **Creator** | **Purpose** |
| Map | Yes | Yes | Main discovery and placement surface |
| Explore / Nearby | Yes | Yes | List-based discovery of nearby points |
| UserView / Point View | Yes | Yes | Point detail and launch screen for AR |
| Creator Tools | No | Yes | Point creation, my points, edit actions |
| Menu / More | Yes | Yes | Settings, permissions help, support, login/logout |

### **Recommended navigation behavior**

  - **Map** should be the default landing tab for visitors
  - **Creator Tools** should appear only after creator login
  - **UserView** is not necessarily a fixed tab in the final UI; it can be a routed screen opened from map or nearby list
  - login entry should live in the menu or a protected creator access screen
  - after creator login, the app should clearly indicate creator mode without making the visitor-facing experience feel cluttered

**Recommended app-shell principle:** same product, different capabilities based on role.

## **7.5 Main screens**

## **7.5.1 Splash / App Launch Screen**

### **Purpose**

Initial loading, environment checks, and routing.

### **Main functions**

  - show branding
  - initialize session
  - detect whether creator session already exists
  - preload basic configuration
  - check network reachability
  - route to map/home

### **Key actions**

  - automatic progress only
  - no heavy interaction

### **Notes**

Should be fast. If loading takes more than a few seconds, show a visible loading state and retry message.

## **7.5.2 Permission Onboarding Screen**

### **Purpose**

Request the permissions needed for location-aware AR usage.

### **Required permissions**

  - location
  - camera
  - optionally media/file access for creator uploads if platform requires it

### **Key actions**

  - allow location
  - allow camera
  - skip for now
  - open system settings if previously denied

### **UX requirements**

  - explain why each permission matters in plain language
  - support partial usage if the user denies permission
  - do not block app entry completely unless the feature truly cannot work without it

### **Example behavior**

|  |  |
| :-: | :-: |
| **Permission state** | **Expected behavior** |
| Location allowed, camera allowed | Full visitor and creator functionality |
| Location allowed, camera denied | Map discovery works, AR blocked with clear messaging |
| Location denied, camera allowed | AR may open only in a limited or manual mode, discovery is degraded |
| Both denied | App opens to informational mode with clear prompts to enable permissions |

## **7.5.3 Home / Map Screen**

### **Purpose**

This is the primary discovery screen and likely the default home screen for most users.

### **Main content**

  - user location on map
  - memory point markers
  - optional clustered markers in dense areas
  - quick access to nearby points
  - creator point-placement action when logged in as creator

### **Key actions**

  - tap a marker to open a point preview
  - move/zoom the map
  - open current location
  - search a point by name or nearby area
  - open route or open-in-maps
  - start point creation if creator

### **Visitor behavior**

Visitors should immediately understand:

  - where they are
  - what memory points are nearby
  - which point they can open next

### **Creator behavior**

Creators should additionally be able to:

  - enter point placement mode
  - long-press or tap to set a point
  - confirm coordinates
  - open their created points for editing

### **UX requirements**

  - high map readability outdoors
  - clear distinction between selected and unselected markers
  - smooth transition from marker tap to preview/UserView
  - support for crowded cemetery layouts

## **7.5.4 Nearby / Explore Screen**

### **Purpose**

Alternative to the map for users who prefer a list.

### **Main content**

  - nearby points sorted by distance
  - point title
  - short description
  - status or readiness label if relevant
  - optional point type

### **Key actions**

  - open point
  - view on map
  - start navigation
  - continue exploring

### **Why it matters**

Not all users browse maps comfortably, especially in bright outdoor environments. A list gives a faster scanning mode.

### **Recommended behavior**

  - default sort by distance
  - optional simple filters later
  - lightweight and fast

## **7.5.5 Point Preview Card**

### **Purpose**

Intermediate layer between the map and the full point screen.

### **Main content**

  - point title
  - short summary
  - distance
  - thumbnail or placeholder
  - availability state, such as near enough, too far, processing, unavailable

### **Key actions**

  - open UserView
  - open route
  - close preview

### **Why it matters**

This keeps map interaction fast and prevents every marker tap from forcing a full-screen transition.

## **7.5.6 UserView Screen**

### **Purpose**

This is the dedicated point-view screen you clarified in the architecture. It should act as the main detail screen for a selected memory point.

### **Main content**

  - point title
  - memorial/person summary
  - location status and distance
  - media type and readiness
  - start AR button
  - audio-only or fallback viewing option where available
  - status label such as ready, processing, unavailable
  - supporting metadata if useful, such as point type or creator attribution in internal mode

### **Key actions**

  - start AR experience
  - play non-AR or audio-only version if available
  - open in Google Maps / navigate
  - return to map
  - for creators: edit point

### **Why it matters**

UserView is the control center for each memory point. It bridges discovery and immersion.

### **Design expectation**

The screen should make it obvious:

  - what this point is
  - whether the experience is available right now
  - what the user should do next

## **7.5.7 AR Experience Screen**

### **Purpose**

Deliver the core value moment of the product by overlaying AI-generated content at the real-world memory point.

### **Main content**

  - live camera feed
  - anchored AI video and/or avatar
  - subtle guidance UI
  - playback controls
  - exit action

### **Key actions**

  - start/pause/replay
  - switch to audio-only if needed
  - retry load
  - exit AR
  - re-center or recalibrate if tracking is unstable

### **AR UI expectations**

  - minimal chrome
  - strong visibility in outdoor lighting
  - clear guidance when the point is not properly aligned yet
  - fast load from UserView once the user is in range

### **Recommended state flow**

|  |  |
| :-: | :-: |
| **State** | **What the app shows** |
| Initializing | Camera permission check, AR capability check |
| Searching / aligning | Guidance to move device slowly and point camera |
| Ready to render | Entry cue and anchor preview |
| Playing | AI video or avatar content visible |
| Lost tracking | Re-center / move phone / retry message |
| Failed load | Retry, audio-only, or return to UserView |

## **7.5.8 Creator Login Screen**

### **Purpose**

Authenticate authorized creators.

### **Main content**

  - email field
  - password field
  - log in button
  - forgot password / contact admin guidance
  - optional creator-access explanation

### **Key actions**

  - submit login
  - show/hide password
  - contact support/admin path
  - return to visitor mode

### **UX requirements**

  - simple, secure, low-friction
  - no public registration path
  - clear explanation that accounts are admin-created

## **7.5.9 Creator Dashboard / Creator Tools Screen**

### **Purpose**

Entry point for all creator-specific actions.

### **Main content**

  - create new memory point
  - my points
  - draft / processing / active points
  - quick status counts
  - recent point activity

### **Key actions**

  - create point
  - edit existing point
  - view point on map
  - check content status
  - log out

### **Recommended design**

This screen should feel operational and task-oriented, not social or profile-heavy.

## **7.5.10 Create / Edit Memory Point Screen**

### **Purpose**

Allow creators to place and define memory points in the field.

### **Main content**

  - current coordinates
  - map placement view
  - point title
  - short description
  - point type
  - status
  - linked content package or AI asset state
  - save / publish actions

### **Key actions**

  - capture current location
  - move marker on map
  - confirm placement
  - save as draft
  - submit/update
  - attach reference content
  - delete or deactivate if allowed

### **UX requirements**

  - location accuracy indicator must be visible
  - field labels should be minimal and structured
  - support incomplete save as draft
  - warn before overwriting or deleting

### **Recommended validation**

|  |  |
| :-: | :-: |
| **Field / input** | **Rule** |
| Title | Required |
| Coordinates | Required |
| Point type | Recommended |
| Description | Optional but recommended |
| Linked content | Can be optional at creation if saved as draft |

## **7.5.11 My Points Screen**

### **Purpose**

Let creators review and manage their assigned or created memory points.

### **Main content**

  - point list
  - status labels
  - last updated time
  - draft / active / failed / archived grouping
  - quick edit actions

### **Key actions**

  - open point
  - edit point
  - move point
  - change status
  - retry content flow if permitted
  - search owned points

### **Why it matters**

Creators need a reliable operational view, especially when multiple field points are being managed.

## **7.5.12 Settings / Menu Screen**

### **Purpose**

Provide low-frequency controls and support.

### **Main content**

  - permissions status
  - help / how it works
  - privacy placeholder
  - about
  - creator login or logout
  - support/contact option

### **Key actions**

  - open permission settings
  - log in as creator
  - log out
  - view app info
  - access support guidance

### **Notes**

Keep this screen lightweight in v1.

## **7.6 Navigation flows**

## **7.6.1 Visitor primary flow**

1.  Open app
2.  Accept permissions
3.  Land on map
4.  Tap memory point
5.  Open UserView
6.  Walk to target if not yet in range
7.  Start AR
8.  Watch/listen
9.  Return to map or nearby list

## **7.6.2 Creator primary flow**

1.  Open app
2.  Log in with email/password
3.  Open Creator Tools
4.  Tap create point
5.  Capture and confirm location
6.  Enter title/description/type
7.  Save draft or submit
8.  Link or reference content package
9.  Review point in My Points
10. Verify visibility in app and map context

## **7.6.3 Visitor from Google Maps flow**

1.  Discover location in Google Maps
2.  Open or navigate to the location
3.  Launch MyGhostSpot
4.  Open matching point in UserView
5.  Start AR experience when in range

**Assumption:** depending on integration constraints, this may initially be handled via map link, deep link, or point identifier passed into the app.

## **7.7 AR-related interactions**

### **Required AR interactions**

|  |  |
| :-: | :-: |
| **Interaction** | **Expected behavior** |
| Enter AR | Launch from UserView when point is eligible |
| Device alignment | Show guidance if tracking or orientation is weak |
| Anchor content | Place AI asset relative to point location |
| Playback control | Play, pause, replay, mute/unmute if relevant |
| Exit | Return cleanly to UserView |
| Retry | Recover from failed render or network issue |

### **Recommended AR interaction rules**

  - AR should only open when the point is sufficiently near or when a fallback rule explicitly allows remote preview
  - if AR tracking is weak, the UI should explain what to do instead of simply failing
  - if the device does not support ARCore, redirect to non-AR viewing or audio-only mode
  - avoid overloading the screen with controls

### **Suggested AR guidance copy logic**

  - "Move your phone slowly to find the point"
  - "You are too far from the memory point"
  - "AR is unavailable on this device. Open standard playback instead"

## **7.8 Map-related interactions**

### **Required map interactions**

|  |  |
| :-: | :-: |
| **Interaction** | **Expected behavior** |
| View nearby markers | Show memory points in the current area |
| Tap a marker | Open point preview |
| Pan and zoom | Explore the site naturally |
| Re-center | Return to current user location |
| Open point details | Move from map to UserView |
| Start navigation | Help user reach the selected point |
| Creator placement | Allow marker placement or adjustment in creator mode |

### **Creator-specific map interactions**

  - capture current GPS coordinate
  - fine-adjust marker placement
  - verify the final saved point location
  - detect nearby existing points to reduce duplicates

### **Map usability expectations**

  - markers should remain legible in dense locations
  - selected marker state must be obvious
  - distance information should update clearly
  - route guidance should not require complex UX in v1

## **7.9 Content upload and linkage flow in mobile**

### **Recommended v1 approach**

Since content and AI-generation operations are partly admin-led, the mobile app should support a **lightweight creator content flow**, not a heavy media-production flow.

### **Mobile creator content actions**

|  |  |
| :-: | :-: |
| **Action** | **Purpose** |
| Attach existing content package reference | Link the point to already prepared content |
| Upload minimal source image/text where allowed | Support on-site capture of missing materials |
| Mark content as pending admin completion | Allow the location to be created even if content is incomplete |
| View AI generation status | Show whether the asset is draft, processing, ready, failed |

### **Suggested flow**

1.  Creator creates memory point
2.  Creator links existing content package or uploads basic source material
3.  Point saved as draft or pending processing
4.  Admin completes D-ID preparation if needed
5.  Asset becomes ready
6.  Point becomes fully experience-ready

### **Why this approach is better**

It reduces field complexity and keeps creators focused on the hardest mobile problem: accurate point placement.

## **7.10 Error and edge cases**

## **7.10.1 Visitor-side edge cases**

|  |  |
| :-: | :-: |
| **Scenario** | **Expected app behavior** |
| No points nearby | Show informative empty state and map guidance |
| Location permission denied | Allow limited app use and guide user to enable location |
| Camera permission denied | Allow discovery but block AR with clear explanation |
| Poor network near point | Show loading state, retry, and audio-only or fallback if available |
| Point selected but media still processing | Show "not ready yet" state in UserView |
| AR not supported on device | Redirect to fallback viewing mode |
| User too far from point | Show distance-based guidance and navigation option |
| GPS drift in cemetery | Avoid false-positive activation and show confidence guidance |

## **7.10.2 Creator-side edge cases**

|  |  |
| :-: | :-: |
| **Scenario** | **Expected app behavior** |
| Weak GPS during placement | Warn user and encourage retry or manual adjustment |
| Duplicate nearby point detected | Show warning and allow review before save |
| Save fails due to network | Keep draft locally or retry queue if feasible |
| Content package missing | Allow save as draft, block final activation if needed |
| Login fails | Show clear error and contact-admin path |
| Session expired | Prompt re-login without data loss where possible |
| Point moved accidentally | Require confirmation before saving new location |

## **7.10.3 AR-specific edge cases**

|  |  |
| :-: | :-: |
| **Scenario** | **Expected app behavior** |
| Tracking unstable | Show "move phone slowly" or "find surface" guidance |
| Asset fails to load | Retry, fallback, or return to UserView |
| Bright sunlight / low visual contrast | Keep controls and overlays high-contrast |
| User exits camera unexpectedly | Preserve point context when returning |

## **7.11 Performance expectations**

### **Launch and navigation**

  - app launch should feel quick and stable
  - map should open without long blank states
  - transitions from marker to UserView should be near-instant
  - repeated visits to already viewed points should feel faster through caching where practical

### **AR performance**

  - AR entry should not feel like a hard reload of the app
  - preloading should begin near the activation radius
  - frame rate and anchor stability should be acceptable on supported Android devices
  - fallback mode must exist if the full AR experience cannot run well

### **Creator workflow performance**

  - location capture should return quickly with visible confidence state
  - save operations should provide immediate success/failure feedback
  - draft-saving should work even under moderate connectivity issues

### **Suggested target expectations**

|  |  |
| :-: | :-: |
| **Area** | **Practical expectation for v1** |
| App open to map | Fast enough to not feel blocked |
| Marker tap to preview | Immediate |
| UserView load | Within a few seconds |
| AR start when asset ready | As fast as possible, helped by preloading |
| Point save by creator | Immediate confirmation with background sync if needed |

## **7.12 Usability expectations**

### **Visitor usability**

  - zero registration friction
  - obvious next action from every screen
  - map and AR should feel connected
  - large tap targets for outdoor use
  - readable UI under bright daylight
  - minimal text during AR mode

### **Creator usability**

  - point creation should be step-by-step and hard to misuse
  - location certainty must be visible
  - drafts should be easy to save and resume
  - point status should be obvious
  - critical actions must ask for confirmation

### **Accessibility and practical field conditions**

  - high contrast UI
  - concise messaging
  - support for one-handed use where possible
  - avoid heavy keyboard entry outdoors
  - keep forms short
  - do not rely only on tiny map controls

## **7.13 Security and session behavior in mobile**

### **Visitor**

  - anonymous access
  - no stored personal account data required

### **Creator**

  - secure email/password authentication
  - token/session persistence with expiration
  - logout support
  - role-checked API access
  - protected creator endpoints

### **Recommended rules**

  - creator session survives normal app restarts unless expired
  - sensitive actions require a valid session
  - session expiry should not destroy unsaved draft point data

## **7.14 Recommended mobile-state model**

The mobile app should manage state explicitly for both content and user mode.

### **User mode states**

  - Visitor
  - Creator logged in
  - Creator session expired

### **Point states**

  - Draft
  - Pending content
  - Processing
  - Ready
  - Failed
  - Inactive / Archived

### **Experience states**

  - Out of range
  - In range / preloading
  - Ready to launch
  - Playing
  - Failed / unavailable

This state-driven design will simplify UX clarity and reduce hidden edge-case behavior.

## **7.15 Mobile app specification summary**

The mobile app should be designed as a **map-first, AR-centered, role-aware field product**.

Its most important screens are:

  - **Map**
  - **UserView**
  - **AR Experience**
  - **Creator Tools**
  - **Create/Edit Point**

Its most important success criteria are:

  - visitors can discover and experience points without friction
  - creators can place points accurately on-site
  - the app behaves predictably in real-world outdoor conditions
  - map, point detail, and AR feel like one coherent journey 

# 8\. Web/Admin Panel Specification  

# **8. Web/Admin Panel Specification**

### **8.1 Purpose of the web/admin panel**

The web application in MyGhostSpot should function as an **admin-only operational control layer**. It is not a public website, not a creator self-service portal, and not part of the visitor discovery journey.

Its main job is to support the mobile product by giving admins the ability to:

  - create and manage creator accounts
  - manage memory points centrally
  - prepare and organize source content
  - configure D-ID-related generation parameters
  - monitor AI generation and content readiness
  - maintain data quality and operational stability

In practical terms, the web/admin panel should be designed as a **lightweight content and operations console** that keeps the mobile experience working reliably.

## **8.2 Core responsibilities of the admin panel**

|  |  |
| :-: | :-: |
| **Responsibility** | **Why it exists** |
| Manage creators | Creation is controlled and requires admin-issued credentials |
| Manage memory points | Admin needs central visibility and correction ability |
| Manage AI content preparation | D-ID inputs and outputs need operational handling |
| Configure D-ID parameters | AI generation quality and consistency depend on controllable settings |
| Review generated assets | Prevent broken or incorrect visitor experiences |
| Monitor status and errors | The product relies on multiple integrations and async processing |
| Maintain map/data integrity | Mobile experience depends on correct location and asset linkage |

## **8.3 Admin panel users**

For the current version, the web interface is intended for internal or authorized operational staff only.

### **Primary web-admin users**

  - system admin
  - content operations admin
  - project operator
  - pilot manager
  - technical support/admin staff

### **Not intended for**

  - visitors
  - creators
  - public users
  - self-registering memorial owners

**Product rule:** creators use the mobile app only. Admin uses the web interface only.

## **8.4 Recommended admin panel navigation structure**

A practical v1 navigation model would be a left-side menu or top-level admin nav with the following sections:

|  |  |
| :-: | :-: |
| **Section** | **Purpose** |
| Dashboard | High-level operational overview |
| Creators | Account management for creator users |
| Memory Points | Central list and management of all points |
| Content / Media | Source files and linked content packages |
| AI Assets | Generated outputs and generation status |
| D-ID Settings | Generation parameters and integration controls |
| Maps / Visibility | Google Maps-related status and location checks |
| Logs / Diagnostics | Errors, failed jobs, sync issues |
| Admin Settings | Internal configuration and access control |

This structure is operationally clean and matches the real work admins need to do.

## **8.5 Main admin panel screens**

## **8.5.1 Admin Login Screen**

### **Purpose**

Restrict access to the web panel.

### **Main content**

  - email / username
  - password
  - login button
  - optional two-step verification later
  - support contact or internal help note

### **Key actions**

  - log in
  - recover access through internal process
  - show login errors clearly

### **Notes**

This does not need consumer polish. It needs security and clarity.

## **8.5.2 Admin Dashboard**

### **Purpose**

Provide a real-time overview of system health and operational readiness.

### **Main content**

  - total creators
  - total memory points
  - active vs draft vs inactive points
  - AI generation jobs by status
  - failed jobs
  - recently created or updated points
  - pending content actions
  - possible Google Maps publication issues
  - recent system errors

### **Key actions**

  - open failed generation
  - open draft points
  - open points missing linked assets
  - open disabled creator accounts
  - jump to logs or specific records

### **Why it matters**

The dashboard should help admin answer basic daily questions quickly:

  - what is live
  - what is broken
  - what is still incomplete
  - what needs intervention now

## **8.5.3 Creator Management Screen**

### **Purpose**

Create and manage creator accounts.

### **Main content**

  - creator list
  - name
  - email
  - account status
  - created date
  - last activity
  - assigned organization or region if used
  - count of memory points created

### **Key actions**

  - create creator account
  - edit creator details
  - reset password
  - disable / enable account
  - view creator's points
  - delete or archive creator account if needed

### **Required form fields for creator account creation**

|  |  |  |
| :-: | :-: | :-: |
| **Field** | **Required** | **Notes** |
| Name | Yes | Internal identification |
| Email | Yes | Login identifier |
| Password | Yes | Initial password set by admin |
| Role | Yes | Should be creator |
| Status | Yes | Active/inactive |
| Organization / project group | No | Optional for future grouping |

### **Product behavior**

  - no public registration flow
  - no creator self-approval
  - no Google/Apple identity providers
  - admin remains the sole source of creator access

## **8.5.4 Memory Point Management Screen**

### **Purpose**

Give admin a central, searchable view of all memory points in the system.

### **Main content**

  - point ID
  - title
  - status
  - creator
  - creation date
  - last updated
  - point type
  - linked AI asset status
  - map visibility status
  - coordinates summary

### **Key actions**

  - view point details
  - edit point metadata
  - change point status
  - deactivate / archive point
  - delete point
  - open on map
  - inspect linked content and AI assets
  - fix bad coordinates
  - review publication readiness

### **Recommended filters**

  - by status
  - by creator
  - by point type
  - by AI asset state
  - by date created
  - by Google Maps publication state

### **Recommended statuses**

  - Draft
  - Pending Content
  - Processing
  - Ready
  - Failed
  - Inactive
  - Archived

### **Why it matters**

Admin needs a single place to see whether the content and location network is coherent. This screen is the operational backbone of the admin panel.

## **8.5.5 Memory Point Detail Screen**

### **Purpose**

Show the full operational record of one memory point.

### **Main content**

  - title
  - description
  - point type
  - creator
  - creation/update timestamps
  - coordinates
  - map preview
  - linked source media
  - linked AI assets
  - D-ID generation history
  - current publication status
  - Google Maps visibility state
  - internal notes or issue flags

### **Key actions**

  - edit metadata
  - move coordinates
  - relink content
  - activate / deactivate
  - re-run generation
  - archive
  - inspect logs related to that point

### **Recommended layout**

A tabbed layout is useful:

  - Overview
  - Location
  - Content
  - AI Assets
  - Logs

This keeps the record readable without making the page too dense.

## **8.5.6 Map Review Screen**

### **Purpose**

Provide a spatial overview of all memory points from the admin side.

### **Main content**

  - map with all point markers
  - marker clustering in dense areas
  - selectable point markers
  - filters by status/type/creator
  - duplicate or overlap warnings

### **Key actions**

  - open a selected point
  - inspect nearby duplicates
  - verify map placement
  - check whether a point appears in the right area
  - correct location metadata

### **Why it matters**

Even though creators place points in mobile, admin still needs a spatial QA screen. This is especially important in cemeteries, where marker density and GPS drift can create placement issues.

## **8.5.7 Content / Media Management Screen**

### **Purpose**

Manage source materials used for AI generation and point presentation.

### **Main content**

  - uploaded files list
  - linked point
  - media type
  - upload date
  - file state
  - preview thumbnail where possible
  - source completeness status

### **Key actions**

  - upload source image
  - upload source video
  - upload narrative text
  - replace media
  - delete media
  - preview media
  - attach media to point
  - mark content package complete

### **Recommended file categories**

|  |  |
| :-: | :-: |
| **Category** | **Examples** |
| Portrait / image | Old portrait, scanned photo |
| Video | Source memorial clip |
| Narrative text | Biography, memorial message, script |
| Supporting material | Notes, background reference |

### **Notes**

The admin panel should keep content operations straightforward. It does not need to become a full DAM system in v1.

## **8.5.8 AI Assets Screen**

### **Purpose**

Manage generated D-ID outputs and their relationship to memory points.

### **Main content**

  - generated asset list
  - linked memory point
  - output type, such as video or avatar
  - generation status
  - generation date
  - current active version
  - preview availability
  - failure reason if applicable

### **Key actions**

  - preview generated output
  - mark output active/inactive
  - relink output to a different point if needed
  - regenerate asset
  - compare versions if more than one exists
  - flag failed output for intervention

### **Recommended output statuses**

  - Queued
  - Processing
  - Ready
  - Failed
  - Deprecated
  - Archived

### **Why it matters**

AI output is central to the product promise. Admin needs visibility into whether the generated content is usable before visitors see it.

## **8.5.9 D-ID Settings / Configuration Screen**

### **Purpose**

Manage generation-related settings and integration behavior.

### **Main content**

  - available D-ID configuration presets
  - generation parameter forms
  - model/input options if exposed
  - integration state
  - recent generation activity
  - API status indicator if feasible

### **Key actions**

  - edit parameter presets
  - save configuration profile
  - assign config to a point or content package
  - trigger generation job
  - retry failed job
  - test generation with sample input if useful

### **Practical v1 approach**

This screen should focus on only the settings the team actually needs to control. Do not expose every possible provider option unless there is a clear operational benefit.

### **Recommended configuration concept**

|  |  |
| :-: | :-: |
| **Setting group** | **Example purpose** |
| Input settings | Define source asset expectations |
| Output settings | Select video/avatar output mode |
| Quality / style profile | Keep generation consistent |
| Retry / timeout behavior | Improve operational reliability |

**Assumption:** some D-ID settings may be stored as internal templates rather than editable field-by-field controls.

## **8.5.10 Google Maps / Visibility Screen**

### **Purpose**

Give admin oversight into how memory points relate to Google Maps.

### **Main content**

  - list of points expected to appear on Google Maps
  - publication / linkage status
  - map link
  - visibility issues
  - sync date or update state if available

### **Key actions**

  - verify visibility status
  - regenerate map link
  - re-publish or re-sync point metadata
  - inspect failed map-publication state
  - open point in Google Maps context

### **Why it matters**

You explicitly stated that creator-added memory points should appear on Google Maps as well. That makes map visibility part of the operational product, not just a technical extra.

### **Assumption**

For v1, this screen may begin as a visibility and link-management screen rather than a full deep Google Maps content-management interface.

## **8.5.11 Logs / Diagnostics Screen**

### **Purpose**

Help admin and technical operators detect and troubleshoot failures.

### **Main content**

  - failed AI jobs
  - asset retrieval failures
  - broken point-to-asset links
  - login failures
  - map-publication issues
  - API or sync errors
  - time-stamped events

### **Key actions**

  - filter logs by type
  - filter by point
  - filter by creator
  - open related record
  - retry failed operation if allowed
  - export log snippet if needed

### **Why it matters**

This product depends on several moving parts:

  - mobile input
  - backend orchestration
  - AI generation
  - media linkage
  - map visibility
  - AR delivery

Without a usable diagnostic layer, pilot operations will be difficult.

## **8.6 Admin workflows**

## **8.6.1 Create creator account workflow**

1.  Admin opens Creators
2.  Clicks Create Creator
3.  Enters name, email, password, role, status
4.  Saves account
5.  Creator account becomes active
6.  Creator can now log into the mobile app

### **Required safeguards**

  - prevent duplicate emails
  - validate password rules
  - show account status clearly
  - allow later reset or disable

## **8.6.2 Prepare memory point content workflow**

1.  Admin opens a memory point
2.  Reviews whether source content exists
3.  Uploads or attaches portrait, text, and other media
4.  Confirms content package completeness
5.  Configures D-ID parameters if needed
6.  Triggers generation or queues the job

### **Why this workflow matters**

It separates operational content preparation from the field-placement act done by creators.

## **8.6.3 Review generated AI output workflow**

1.  Admin opens AI Assets or a specific point
2.  Sees generation result
3.  Previews video and/or avatar output
4.  Approves it for use or marks it for regeneration
5.  Links the correct output as active for that point
6.  Changes point status to Ready if appropriate

### **Suggested approval logic**

Formal moderation is out of scope, but an operational readiness check is still useful:

  - output valid
  - linked correctly
  - not corrupted
  - usable in mobile

## **8.6.4 Correct bad point data workflow**

1.  Admin notices an issue from dashboard, logs, or map review
2.  Opens the point
3.  Fixes metadata, coordinates, content links, or status
4.  Saves changes
5.  System updates the mobile-facing record
6.  If necessary, re-publishes Google Maps visibility metadata

### **Common correction scenarios**

  - wrong title
  - wrong coordinates
  - duplicate point
  - missing linked AI asset
  - point marked ready but asset failed
  - Google Maps visibility mismatch

## **8.7 Key actions the web panel must support**

|  |  |
| :-: | :-: |
| **Area** | **Must support in v1** |
| User management | Create creator, reset password, disable/enable creator |
| Memory points | View, edit, deactivate, delete, inspect |
| Content | Upload, preview, replace, link |
| AI | Configure D-ID parameters, track status, preview output, retry generation |
| Maps | Inspect point placement and Google Maps visibility state |
| Operations | Dashboard, logs, error handling, basic diagnostics |

## **8.8 Permissions and access model for the admin panel**

### **Recommended access rules**

|  |  |
| :-: | :-: |
| **Role** | **Access** |
| Visitor | No web-admin access |
| Creator | No web-admin access |
| Admin | Full access to admin panel |
| Future sub-admin roles | Optional later, not required in v1 |

### **Recommended admin security controls**

  - secure login
  - protected sessions
  - role-checked routes and API calls
  - basic audit trail for changes
  - manual account control
  - no anonymous access

### **Assumption**

Granular internal role separation, such as content admin vs technical admin, can be deferred unless needed immediately by the operating team.

## **8.9 Performance and usability expectations**

### **Performance expectations**

  - dashboard should load fast enough to support daily use
  - point list filtering should be responsive
  - point details should open without noticeable lag
  - media previews should not freeze the UI
  - AI status refresh should be easy to understand

### **Usability expectations**

  - operationally clear, not visually fancy
  - dense enough for admin efficiency, but not cluttered
  - actions should be obvious and reversible where possible
  - status labels must be consistent across all screens
  - destructive actions should require confirmation

### **Design principle**

The admin panel should optimize for:

  - clarity
  - control
  - recoverability
  - traceability

It does not need consumer-style delight. It needs operational confidence.

## **8.10 Recommended admin status model**

A shared status language across the admin panel and backend will reduce confusion.

### **Memory point statuses**

  - Draft
  - Pending Content
  - Processing
  - Ready
  - Failed
  - Inactive
  - Archived

### **AI asset statuses**

  - Queued
  - Processing
  - Ready
  - Failed
  - Deprecated
  - Archived

### **Creator account statuses**

  - Active
  - Disabled
  - Suspended
  - Archived

### **Map visibility statuses**

  - Not Published
  - Pending
  - Published
  - Failed
  - Hidden

This status model will make both admin workflows and technical integration easier to manage.

## **8.11 What the web panel should not become in v1**

To keep scope controlled, the admin panel should **not** become any of the following in the first release:

  - a public CMS
  - a creator self-service portal
  - a complex workflow engine
  - a full digital asset management suite
  - a legal/privacy case-management tool
  - a BI platform
  - a large-scale moderation product

It should stay focused on supporting the mobile experience and the pilot operating model.

  
  

# 9\. Functional Role of Each System Component  

# **9. Functional Role of Each System Component**

### **9.1 Purpose of this block**

This section defines what each major system component is responsible for in the MyGhostSpot ecosystem. The goal is to remove ambiguity between:

  - product-facing responsibility
  - technical responsibility
  - data responsibility
  - integration responsibility

This matters because the architecture is centered around a **Central API**, while the product itself is experienced primarily through the **mobile app**. If roles between components are not clear, the implementation can easily become fragmented.

## **9.2 System architecture interpretation**

At a high level, MyGhostSpot should be understood as a **mobile-first location experience platform** with a supporting admin and orchestration backend.

### **Functional architecture summary**

|  |  |
| :-: | :-: |
| **Component** | **Primary role** |
| Mobile Application | Main user experience for visitors and creators |
| Web Application | Admin operations and control console |
| Central API | Core orchestration, business logic, and integration hub |
| D-ID API | AI media generation provider |
| Google ARCore | AR rendering and spatial presentation layer |
| Google Maps | Mapping, location discovery, and external visibility layer |
| Database | System of record for users, memory points, assets, and statuses |
| UserView | Mobile screen for viewing a memory point and launching the experience |
| Implied supporting services | Storage, authentication/session handling, logging, background jobs, map publication logic |

### **Architectural principle**

The product should not allow external services to define product logic directly. External tools such as D-ID, ARCore, and Google Maps should be **capabilities used by the product**, while MyGhostSpot retains control of:

  - identity
  - memory point state
  - publication state
  - content linkage
  - visitor experience flow

That is why the **Central API** is the most important backend component.

## **9.3 Web Application**

### **Functional role**

The **Web Application** is the admin-facing control surface for the service. It exists to support, configure, and maintain the mobile experience, not to replace it.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **Web application role** |
| Admin access | Authenticate admins and give them access to system controls |
| Creator account management | Create, update, disable, and reset creator accounts |
| Memory point management | View and manage all memory points centrally |
| Content operations | Upload and organize source media and memorial text |
| AI configuration | Configure D-ID-related generation settings |
| AI output review | Inspect generated video/avatar results |
| Operational oversight | Monitor statuses, logs, and failures |
| Map review | Verify point placement and visibility state |

### **What it is not responsible for**

  - public visitor discovery
  - creator field placement of points
  - direct AR rendering
  - end-user memorial consumption

### **Product interpretation**

The web application is an **operations console**, not the main product experience.

### **Implementation implication**

The web application should call the same Central API domain logic as mobile, rather than bypassing it with direct database writes wherever possible. This keeps business rules consistent.

## **9.4 Mobile Application**

### **Functional role**

The **Mobile Application** is the main product surface. It serves:

  - **visitors**, who discover and experience memory points without login
  - **creators**, who log in and place/manage memory points in the field

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **Mobile application role** |
| Visitor discovery | Show nearby memory points on map and in list form |
| Point viewing | Present point details through UserView |
| AR experience | Launch and render the memorial experience using ARCore |
| Proximity awareness | Detect when user is close enough to load or unlock content |
| Creator authentication | Let approved creators log in with email/password |
| Point placement | Capture coordinates and create memory points on-site |
| Point editing | Allow creators to update their points in the field |
| Content linkage support | Let creators connect points to content references or minimal uploaded inputs |
| Google Maps continuity | Support route/open-in-maps and map-aware discovery flows |

### **What it is not responsible for**

  - full admin operations
  - creator account creation
  - deep AI-generation parameter administration
  - full background job orchestration

### **Product interpretation**

The mobile app is not only a viewer. It is both:

  - the **consumer experience**
  - the **creator field tool**

This is a critical product decision and should shape UX, permissions, and technical architecture.

## **9.5 Central API**

### **Functional role**

The **Central API** is the orchestration and control layer of the whole system. It should act as the single source of business rules and the single integration hub between all major components.

### **Why it is central**

Without the Central API, the system becomes a set of disconnected tools:

  - mobile talks to maps and AR separately
  - admin manipulates content directly
  - D-ID generates assets without product state control
  - data consistency breaks down

The Central API should prevent that by owning the service logic.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **Central API role** |
| Authentication | Validate creator/admin credentials and manage secure sessions |
| Authorization | Enforce role-based access for visitor, creator, and admin |
| Memory point lifecycle | Create, update, retrieve, deactivate, archive, delete points |
| Location logic | Store coordinates, activation radius, and map-related metadata |
| Content linkage | Connect memory points with media and AI outputs |
| AI job orchestration | Prepare, send, track, and finalize D-ID generation jobs |
| Retrieval APIs | Return nearby points, point details, UserView data, and AR payloads |
| Publication state | Control whether a point is draft, processing, ready, failed, or inactive |
| Google Maps support | Manage data needed for maps visibility or map-link publication |
| Diagnostics | Track logs, errors, and operational events |
| Data shaping | Deliver mobile-optimized and admin-optimized responses from the same underlying records |

### **What it should not do**

  - perform raw AR rendering
  - directly act as the UI layer
  - embed provider-specific UI assumptions in business logic
  - let external integrations become the source of truth

### **Product interpretation**

The Central API is the **service brain** of MyGhostSpot.

### **Technical implication**

It should expose a clean contract for:

  - mobile read/write actions
  - admin operations
  - asynchronous AI workflows
  - location-aware content retrieval

## **9.6 D-ID API**

### **Functional role**

The **D-ID API** is the external AI media generation provider. Its job is to turn source content into one or more consumable AI outputs used by MyGhostSpot.

Based on your clarification, it should be treated as supporting both:

  - **AI video output**
  - **AI avatar output**

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **D-ID role** |
| AI generation | Process submitted source materials into generated media |
| Output production | Return usable video/avatar assets or generation references |
| Generation response | Provide success, failure, and processing states back to MyGhostSpot |

### **What it is not responsible for**

  - memory point creation
  - publication decisions
  - visitor access rules
  - map behavior
  - user account management
  - final AR experience flow

### **Product interpretation**

D-ID is a **content-generation dependency**, not a product control layer.

### **Technical implication**

D-ID should be accessed by the Central API, not directly by visitor-facing mobile flows. This keeps:

  - credentials secure
  - job tracking consistent
  - errors manageable
  - provider coupling lower

### **Assumption**

For v1, MyGhostSpot should treat D-ID generation as asynchronous and store generation state internally rather than assuming an instant response flow.

## **9.7 Google ARCore**

### **Functional role**

**Google ARCore** is the AR runtime that enables MyGhostSpot to place and display memorial content in the real-world camera view on supported Android devices.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **ARCore role** |
| Device AR support | Provide AR capability on supported devices |
| Camera-space rendering | Enable placement of visual content in the camera view |
| Spatial anchoring | Help anchor media relative to the real-world environment |
| Session tracking | Support stable rendering during user movement |

### **What it is not responsible for**

  - deciding what content to show
  - storing memory points
  - map discovery
  - user permissions logic beyond platform APIs
  - AI generation
  - product state management

### **Product interpretation**

ARCore is the **experience renderer**, not the memory-point system.

### **Technical implication**

The mobile app should decide:

  - when AR is allowed to start
  - which memory point is being viewed
  - which asset to render
  - what fallback to show if AR fails

ARCore should only handle the spatial rendering layer.

### **Assumption**

For v1, ARCore should be used for anchored 2D / 2.5D overlays rather than complex full 3D character systems.

## **9.8 Google Maps**

### **Functional role**

**Google Maps** is the mapping and external visibility layer of the service. It supports both product usability and distribution.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **Google Maps role** |
| Map visualization | Show location context and support map-based discovery |
| Navigation continuity | Help users move toward a selected point |
| External discoverability | Surface creator-added memory points outside the app |
| Place-linking support | Support links and route entry into relevant locations |

### **What it is not responsible for**

  - being the source of memory point truth
  - deciding whether a point is ready
  - storing full memorial content logic
  - controlling the AR experience
  - replacing the app as the experience destination

### **Product interpretation**

Google Maps is both:

  - a **utility layer** for geospatial context
  - a **distribution channel** for location visibility

That makes it more important than a normal map SDK add-on.

### **Technical implication**

The system should keep the canonical point record inside MyGhostSpot, then project selected data outward to Google Maps or related map links.

### **Assumption**

In v1, "appear on Google Maps" may initially be implemented through structured location publishing, map links, and visibility workflows, rather than full advanced place-management automation.

## **9.9 Database**

### **Functional role**

The **Database** is the system of record for structured product data. It should store the entities and relationships that define the state of MyGhostSpot.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **Database role** |
| User storage | Store admin and creator account records |
| Memory point storage | Store point metadata, location, statuses, ownership |
| Asset storage metadata | Store references to source media and generated outputs |
| Relationship storage | Link users, points, content, AI assets, and statuses |
| Operational history | Store timestamps, logs, and important audit events |
| Retrieval support | Enable query patterns for mobile and admin use cases |

### **What it is not responsible for**

  - heavy binary media delivery by itself
  - rendering AR
  - managing live provider integrations
  - handling UI logic

### **Product interpretation**

The database is the **truth layer for product state**, but not the full media-delivery layer by itself.

### **Technical implication**

Large binaries such as videos and images should likely live in object storage, while the database stores:

  - metadata
  - references
  - statuses
  - relationships

## **9.10 UserView**

### **Functional role**

Per your clarification, **UserView is a specific screen in the mobile app**. It is not a separate platform or service from the user perspective.

### **Product role**

UserView should function as the **memory-point detail and experience-launch screen** between map discovery and AR consumption.

### **What it is responsible for**

|  |  |
| :-: | :-: |
| **Responsibility area** | **UserView role** |
| Point context | Show what the selected memory point is |
| Readiness state | Indicate whether the experience is available, processing, or unavailable |
| Action launch | Let the user start AR or fallback playback |
| Navigation bridge | Connect map discovery to experience entry |
| Point metadata display | Present title, summary, and location-related context |

### **What it is not responsible for**

  - rendering AR itself
  - performing backend orchestration
  - account administration
  - being the source of data truth

### **Technical interpretation**

Although UserView is a screen, the architecture may have labeled it because it implies a distinct **data projection** or **view model**. In implementation terms, that likely means the backend should provide a payload optimized for this screen, such as:

  - point title
  - short story
  - distance
  - status
  - asset readiness
  - action availability

### **Product interpretation**

UserView is a major part of the UX because it is where the app should answer:

  - What is this point?
  - Is it ready?
  - What can I do now?

## **9.11 Implied supporting services and components**

The architecture image shows the major visible components, but a production-ready implementation will require several supporting services even if they are not labeled explicitly.

### **9.11.1 Media / Object Storage**

#### **Functional role**

Store source media and generated AI assets such as images, video files, thumbnails, and related binary assets.

#### **Why it is needed**

The database should not carry heavy media payloads directly. The system needs a storage layer for:

  - uploaded source files
  - generated D-ID outputs
  - cached previews
  - downloadable media variants

#### **Responsibilities**

  - durable media storage
  - asset retrieval by secure URL or tokenized access
  - linkage to memory point and AI asset records

### **9.11.2 Authentication / Session Service**

#### **Functional role**

Handle secure login and session validation for creators and admins.

#### **Why it is needed**

MyGhostSpot uses controlled creator access. This requires more than a simple password check. The product needs:

  - secure session issuance
  - token validation
  - role claims
  - expiration handling

#### **Responsibilities**

  - sign-in flow support
  - token/session lifecycle
  - role-aware access enforcement

**Assumption:** this may be implemented inside the Central API rather than as a separate deployable service in v1.

### **9.11.3 Background Job / Queue Processor**

#### **Functional role**

Handle asynchronous work outside the request-response cycle.

#### **Why it is needed**

AI generation and some publication tasks should not block user requests.

#### **Likely responsibilities**

  - dispatch D-ID generation jobs
  - poll or receive generation results
  - process asset-linking tasks
  - update point statuses
  - trigger Google Maps publication/sync tasks where needed

### **Product implication**

Without background processing, the service will be brittle and slow.

### **9.11.4 Logging / Monitoring Service**

#### **Functional role**

Capture system and integration health data.

#### **Why it is needed**

This product relies on multiple moving parts and outdoor conditions. Teams need visibility into:

  - failed generation jobs
  - broken links
  - API errors
  - login failures
  - map publication issues

#### **Responsibilities**

  - structured event logging
  - error tracking
  - basic operational alerts
  - support for admin diagnostics view

### **9.11.5 Notification / Messaging Layer**

#### **Functional role**

Support operational communication for asynchronous events if needed.

#### **Why it is needed**

Not critical for v1, but useful later for:

  - generation-complete notifications
  - failed-processing alerts
  - admin operational messaging

**Assumption:** in MVP this can remain minimal or be replaced by dashboard status checks.

### **9.11.6 Map Publication / Visibility Service**

#### **Functional role**

Manage the logic that makes creator-added points appear on Google Maps or maintain map-link visibility state.

#### **Why it is needed**

You confirmed that memory points added by creators should appear on Google Maps. That requirement implies some service logic beyond simple in-app map display.

#### **Responsibilities**

  - prepare location metadata
  - maintain publication status
  - store external map references
  - monitor publication or linkage outcomes

**Assumption:** this may start as a smaller workflow within the Central API and expand later if Google Maps publication becomes more sophisticated.

## **9.12 Component interaction model**

### **Simplified responsibility flow**

|  |  |
| :-: | :-: |
| **Flow step** | **Primary component** |
| Visitor discovers point | Mobile app + Google Maps data/context + Central API |
| Visitor opens point details | Mobile app + UserView payload from Central API |
| Visitor experiences AR | Mobile app + ARCore + AI/media asset references |
| Creator logs in | Mobile app + Central API + auth/session layer |
| Creator places a point | Mobile app + Central API + Database + Maps context |
| Admin manages creators | Web app + Central API + Database |
| Admin configures AI | Web app + Central API + D-ID |
| System stores and serves state | Database + storage + Central API |
| Point appears externally on maps | Central API / map publication workflow + Google Maps |

## **9.13 Responsibility boundaries to keep strict**

To avoid future architecture drift, the following boundaries should remain clear:

### **Boundary 1: Mobile app vs Central API**

  - Mobile should own UX and client-side interaction
  - Central API should own business rules and system state

### **Boundary 2: Central API vs D-ID**

  - Central API owns job orchestration and product state
  - D-ID only provides generation capability

### **Boundary 3: Central API vs Google Maps**

  - MyGhostSpot owns canonical point data
  - Google Maps is an external visibility and navigation layer

### **Boundary 4: ARCore vs product logic**

  - ARCore renders
  - MyGhostSpot decides what, when, and why to render

### **Boundary 5: UserView vs backend data model**

  - UserView is a screen
  - the backend should provide a payload tailored to it
  - UserView itself should not be mistaken for the source of truth

## **9.14 Recommended component ownership summary**

This is the cleanest implementation-oriented interpretation of system ownership:

|  |  |
| :-: | :-: |
| **Component** | **Owns** |
| Web Application | Admin workflows and operational controls |
| Mobile Application | Visitor and creator experience flows |
| Central API | Service logic, orchestration, and integration control |
| D-ID API | AI media generation capability |
| Google ARCore | AR rendering capability |
| Google Maps | Geospatial visualization and external visibility |
| Database | Structured product state and relationships |
| UserView | Point detail / launch experience in mobile |
| Storage / jobs / logging services | Reliability, assets, async processing, observability |

## **9.15 Product interpretation summary for this block**

MyGhostSpot should be built as a **controlled orchestration platform around a mobile-first experience**.

The key design principle is simple:

  - **mobile owns experience**
  - **web owns operations**
  - **Central API owns product logic**
  - **external providers supply capabilities**
  - **database owns state**
  - **UserView owns the point-level user context inside the app**

That separation will make the system easier to build, test, and evolve without turning integrations into accidental product owners.

  
  

# 10\. Recommended MVP Scope  

# **10. Recommended MVP Scope**

### **10.1 MVP objective**

The right MVP for **MyGhostSpot** is not "build the full future platform."  
It is to prove one complete and reliable loop:

1.  **Admin creates creator access and prepares content**
2.  **Creator logs into the mobile app and places a memory point on-site**
3.  **The system links that point with AI-generated media**
4.  **The point becomes discoverable in the app and on Google Maps**
5.  **A visitor reaches the location and experiences it in AR**

If version 1 proves that loop in a real cemetery environment, the product has validated its core value. If it does not, adding more features will not fix the main risk.

## **10.2 MVP design principle**

The MVP should optimize for these five outcomes:

|  |  |
| :-: | :-: |
| **MVP principle** | **What it means** |
| Controlled publishing | Only admin-created creators can publish points |
| Low-friction visitor use | Visitors do not register or log in |
| Accurate location anchoring | Creators can place points reliably on-site |
| Stable AI-to-point linkage | Generated assets are correctly attached to points |
| Simple on-site experience | Visitors can find, open, and view a point with minimal confusion |

Everything in v1 should support one or more of these outcomes.

## **10.3 What must be in Version 1**

## **A. Mobile app, visitor experience**

These are the minimum visitor-facing capabilities required to prove the product.

|  |  |
| :-: | :-: |
| **Feature** | **Why it must be in v1** |
| Open app without login | Visitor friction must be near zero |
| Location permission flow | The app cannot work as intended without location context |
| Camera permission flow | AR experience depends on camera access |
| Map with nearby memory points | This is the primary discovery surface |
| Marker tap -\\\> point preview -\\\> UserView | Users need a clear path from discovery to experience |
| UserView screen | This is the point detail and action-launch screen |
| Distance/proximity awareness | The experience is location-based, not generic media browsing |
| AR entry for eligible points | This is the product's main differentiator |
| AI video and/or avatar playback in AR | This is the core output users come to experience |
| Basic fallback state if content is unavailable | Prevents hard failure when an asset is not ready |

### **Minimum visitor flow for v1**

  - open app
  - allow permissions
  - see map
  - select point
  - view UserView
  - approach location
  - launch AR
  - consume experience
  - return to map

If this flow is not clean, the MVP is not yet valid.

## **B. Mobile app, creator experience**

These are the minimum creator capabilities required to produce the content network.

|  |  |
| :-: | :-: |
| **Feature** | **Why it must be in v1** |
| Creator login with email/password | Publishing is controlled |
| Role-based creator mode | Visitor and creator behaviors must remain separated |
| Create memory point in mobile | This is a confirmed core product rule |
| Capture current GPS location | Required to anchor the point to a real place |
| Adjust point on map | GPS alone will not be accurate enough in all cases |
| Save title and short description | Required for identification and point browsing |
| Save point as draft | Allows field work even when content is not yet complete |
| Edit point location and metadata | Real-world placement will need correction |
| My Points view | Creators need a basic operational list of their work |
| Basic point status visibility | Creator must know whether a point is draft, processing, ready, etc. |

### **Why this matters**

Without a usable creator flow, there is no scalable way to build the memory-point inventory.

## **C. Web/admin panel**

The admin panel should stay lean, but some admin capabilities are non-negotiable.

|  |  |
| :-: | :-: |
| **Feature** | **Why it must be in v1** |
| Admin login | Protects the operating console |
| Create creator accounts | This is the foundation of controlled publishing |
| Reset / disable creator access | Needed for operational control |
| View all memory points | Admin needs central oversight |
| Edit memory point data | Required for correction and QA |
| Upload/manage source media | AI generation depends on source material |
| Configure D-ID parameters | Present in the architecture and needed operationally |
| View AI generation status | AI processing is asynchronous and failure-prone |
| Link generated asset to memory point | Critical for correct visitor playback |
| Basic logs / error visibility | Necessary for operating a pilot |

### **Minimum admin role in v1**

The admin panel should function as a **control and repair interface**, not a fully featured content-management suite.

## **D. Backend / Central API**

These backend capabilities are required for the product to function as one system.

|  |  |
| :-: | :-: |
| **Feature** | **Why it must be in v1** |
| Creator/admin authentication endpoints | Required for controlled access |
| Role-based authorization | Required for visitor vs creator vs admin separation |
| Memory point CRUD | The main business object must be manageable |
| Nearby point retrieval | Required for visitor discovery |
| UserView payload retrieval | Required for the point-detail screen |
| AI asset linkage and status handling | Required for correct playback |
| D-ID orchestration | Required to generate AI outputs |
| Point lifecycle statuses | Required to manage draft, processing, ready, failed states |
| Map/Google Maps metadata support | Required because points should appear on Google Maps |
| Logging / event tracking | Required for debugging and pilot operation |

### **MVP backend principle**

The Central API should already be the single orchestration hub in v1.  
This is not something to postpone.

## **E. External integrations**

These integrations are part of the MVP, not later enhancements.

|  |  |
| :-: | :-: |
| **Integration** | **MVP role** |
| D-ID | Generate AI video and avatar outputs |
| Google ARCore | Render the on-site AR experience |
| Google Maps | Display point context and support external point visibility |

### **Important interpretation**

If any one of these is missing, the product no longer matches the current vision:

  - without D-ID, it is not an AI memorial product
  - without ARCore, it is not the intended AR experience
  - without Google Maps, the location/discovery logic is materially weaker

## **F. Data and storage**

The data layer must support at least:

  - users: admin and creator
  - memory points
  - locations
  - content packages
  - media files
  - AI assets
  - AR placement metadata
  - point statuses
  - map visibility status
  - basic audit/log records

This is the minimum persistent model needed to operate the pilot with confidence.

## **10.4 Recommended MVP feature set by product area**

### **Mobile app MVP**

|  |  |
| :-: | :-: |
| **Include in v1** | **Exclude from v1** |
| Visitor guest mode | Public registration |
| Creator login | Apple login |
| Map discovery | Google login |
| UserView | Social profile features |
| Point detail and status | Community publishing |
| AR viewing | Advanced creator collaboration |
| Creator point creation/editing | Push notifications |
| My Points | Complex search and filtering |
| Basic fallback states | Deep personalization |

### **Web/admin MVP**

|  |  |
| :-: | :-: |
| **Include in v1** | **Exclude from v1** |
| Creator account creation | Public CMS |
| Creator account reset/disable | Self-service creator onboarding |
| Memory point overview | Complex moderation workflow |
| Point detail/edit | Advanced role hierarchies |
| Media upload | Full DAM functionality |
| D-ID parameter configuration | BI/reporting suite |
| AI asset review | Legal/privacy workflow engine |
| Basic logs | Large multi-team workflow tooling |

### **Backend MVP**

|  |  |
| :-: | :-: |
| **Include in v1** | **Exclude from v1** |
| Auth and RBAC | Advanced recommendation engine |
| Point CRUD | Full offline sync platform |
| Nearby point APIs | Multi-tenant architecture if not immediately needed |
| AI job orchestration | Generic plugin marketplace for providers |
| Status model | Highly granular workflow engine |
| Maps support | Over-engineered microservice split |

## **10.5 What should be deferred to Phase 2**

These features are valuable, but they should not block version 1.

## **A. Richer AI experience**

|  |  |
| :-: | :-: |
| **Deferred item** | **Why it should wait** |
| Real-time conversational AI inside AR | High complexity, high UX risk, not required to validate core value |
| More advanced avatar behaviors | Stable playback is more important than advanced interactivity |
| Multiple AI personas per point | Not needed for initial proof of concept |
| Voice customization depth | Nice quality improvement, not core validation |

## **B. Expanded visitor experience**

|  |  |
| :-: | :-: |
| **Deferred item** | **Why it should wait** |
| Saved favorites / history | Requires visitor identity model or local persistence design |
| Social sharing flows | Not essential to proving on-site value |
| Rich recommendation engine | Not needed until point volume grows |
| Advanced text/audio accessibility options | Important later, but not the core risk now |
| Remote preview mode for far-away users | Could weaken the place-based value proposition in MVP |

## **C. Expanded creator capabilities**

|  |  |
| :-: | :-: |
| **Deferred item** | **Why it should wait** |
| Bulk point creation | Premature for pilot scale |
| Multi-step content editing in mobile | Better handled in admin first |
| Team collaboration per point | Adds workflow complexity too early |
| In-app media production tools | Distracts from the real field problem, which is accurate placement |

## **D. Expanded admin capabilities**

|  |  |
| :-: | :-: |
| **Deferred item** | **Why it should wait** |
| Advanced moderation queues | You explicitly deprioritized privacy/moderation for now |
| Fine-grained internal permission models | Single admin role is enough to start |
| Deep analytics dashboards | Basic product and ops metrics are sufficient for MVP |
| Large-scale content workflow automation | Likely unnecessary at pilot stage |

## **E. Platform expansion**

|  |  |
| :-: | :-: |
| **Deferred item** | **Why it should wait** |
| iOS parity with equivalent AR stack | Android-first is the cleanest path given ARCore emphasis |
| Full multilingual content management | Add once target markets expand |
| Generalized non-cemetery use cases | The cemetery use case should be proven first |

## **10.6 Nice-to-have but not essential**

These are useful additions if budget and time allow, but they are not core MVP criteria.

|  |  |
| :-: | :-: |
| **Nice-to-have item** | **Why it is secondary** |
| Audio-only playback mode | Helpful fallback, but the product can launch without it if AR/video is stable |
| QR-code deep-link flow | Improves entry, but not required if discovery already works |
| Duplicate point warning for creators | Helpful for data quality, but not the first blocking feature |
| On-site verification photo during creation | Useful for QA, not essential for first release |
| Point clustering improvements on dense maps | Important later if point density becomes high |
| Basic creator activity history | Helpful operationally, but not required immediately |
| Day/night presentation adjustment | Nice experiential polish, not core system risk |
| Map visibility status screen in admin | Useful, but can start as a simpler status field |
| Unsupported-device fallback experience | Important, but can initially be minimal if pilot device set is controlled |

## **10.7 Recommended MVP release slice**

The cleanest way to deliver the MVP is in four internal slices.

### **Slice 1: Foundation**

  - Central API
  - data model
  - admin authentication
  - creator authentication
  - memory point CRUD
  - map display in mobile
  - UserView data payload

### **Slice 2: Creation and control**

  - creator point placement in mobile
  - creator my-points view
  - admin creator management
  - media upload and content package linkage
  - point status management

### **Slice 3: AI and experience**

  - D-ID integration
  - AI asset generation workflow
  - point-to-asset linking
  - ARCore playback
  - basic failure states

### **Slice 4: Visibility and pilot hardening**

  - Google Maps visibility logic
  - logs/diagnostics
  - basic analytics
  - correction workflows
  - pilot reliability fixes

This sequence reduces risk because each slice builds toward the full proof loop.

## **10.8 Why this MVP scope is realistic**

This MVP is realistic because it keeps the product focused on the hardest and most valuable problem:

**Can MyGhostSpot reliably turn a real memorial location into an AI-powered AR experience that a visitor can actually use on-site?**

It avoids spending early effort on:

  - public growth mechanics
  - social features
  - complex policy systems
  - broad platform expansion
  - overbuilt admin workflow tooling

That is the right decision for a first releasable version.

## **10.9 Main reasons for deferring features**

The key reasons to defer a feature should be explicit:

|  |  |
| :-: | :-: |
| **Reason to defer** | **Meaning** |
| Does not validate core product value | Useful later, but not needed to prove the concept |
| Increases operational complexity too early | Would slow the team before the core loop works |
| Adds UX complexity before the main flow is stable | Risks confusing visitors or creators |
| Depends on unresolved technical assumptions | Better added after the foundation is proven |
| Requires governance/privacy design not yet in scope | Should wait until formal standards are defined |

This gives the team a rational scoping rule instead of subjective feature debate.

## **10.10 Recommended MVP success criteria**

The MVP should be considered successful if the team can demonstrate all of the following:

1.  Admin can create a creator account
2.  Creator can log into mobile and place a new memory point
3.  The system can link that point to AI-generated media
4.  The point appears in MyGhostSpot and is represented in Google Maps flow
5.  A visitor can discover the point, approach it, open UserView, and launch the AR experience
6.  Errors are visible enough that the team can diagnose failures during pilot use

If these conditions are met, the product is ready for real user testing and the next-phase roadmap.

## **10.11 Final MVP recommendation**

**Version 1 should be a controlled Android-first memorial AR pilot with:**

  - visitor guest access
  - creator mobile login and point placement
  - admin account/content control
  - Central API orchestration
  - D-ID AI asset generation
  - Google Maps visibility
  - ARCore-based on-site viewing

Everything else should be judged against one question:

**Does this help prove the real-world memory-point loop?**

If not, it belongs in phase 2 or later.  

  

  
  

# Summary  

# **MyGhostSpot — Phase 1 Product Scope**

## **1. Project Goal**

### **Phase 1 objective**

MyGhostSpot Phase 1 should be delivered as a controlled, pilot-ready memorial AR product focused on validating one complete real-world loop:

  - an admin sets up and controls the system
  - a creator goes on-site and places a memory point
  - the platform links that point to AI-generated media
  - a visitor discovers the point at the location
  - the visitor experiences the content through map and AR without registration

This first phase should **not** be positioned as a broad public platform or an open memorial publishing network. It is a curated first release designed to prove that the core product concept works reliably in a real cemetery or memorial environment.

### **What Phase 1 needs to prove**

For Phase 1 to be considered successful, the product should prove that:

  - admin can create and manage creator accounts
  - creator can log into the mobile app
  - creator can place a memory point accurately in the field
  - the system can connect that point with source content and AI-generated output
  - the point becomes visible in MyGhostSpot and in the Google Maps flow
  - a visitor can discover the point, approach it, and launch the on-site AR experience

This is the right way to define the MVP, because it keeps scope focused on the actual product loop instead of scattered feature expansion.

### **Product framing for estimation**

From an estimation perspective, the product should be understood as:

  - **one mobile app** for visitors and creators
  - **one admin panel** for internal operations
  - **one orchestration backend / Central API**
  - **three critical integrations**: D-ID, Google ARCore, Google Maps

The product sequence is:

  - admin enables
  - creator anchors
  - system generates
  - visitor discovers
  - AR delivers

That sequence is important because it defines real delivery dependencies, not just UX flow.

## **2. Product Surfaces Included in Scope**

## **2.1 Mobile App**

The mobile app is the main product surface in Phase 1.

It supports two modes inside a single application:

  - **Visitor mode**
      
      - no registration
      - no login
      - map-based discovery
      - point viewing
      - AR experience
  - **Creator mode**
      
      - email + password login only
      - accounts created by admin
      - point placement in the field
      - point editing and maintenance

This shared-app model is a meaningful part of scope because it affects:

  - navigation design
  - permission flows
  - role separation
  - backend access rules
  - testing complexity

## **2.2 Admin Web Panel**

The admin panel is an internal operational interface for back-office users only.

Its role in Phase 1 is to:

  - manage creator accounts
  - organize source materials
  - configure AI-generation inputs
  - review generated AI assets
  - maintain memory point records
  - monitor visibility and system issues

It is **not** intended to be:

  - a public portal
  - a creator self-service portal
  - a consumer-facing CMS
  - a full enterprise content platform

Its job is to support the product loop operationally.

## **2.3 Backend / Central API**

The Central API is the core system layer that connects all product surfaces.

It is responsible for:

  - authentication and authorization
  - memory point lifecycle
  - content and asset linkage
  - retrieval for mobile
  - D-ID orchestration
  - map visibility logic
  - logging and diagnostics
  - system state management

This should be estimated as a major workstream, not as a thin backend.

## **2.4 External Integrations**

Phase 1 includes the following integrations:

  - **D-ID**
      
      - AI-generated video and avatar output
  - **Google ARCore**
      
      - AR rendering in the mobile experience
  - **Google Maps**
      
      - map discovery
      - point visibility
      - route/open-in-maps behavior
      - external visibility flow for memory points

These integrations are part of the product definition, not optional enhancements.

## **3. Detailed Scope for Each Surface**

# **3.1 Mobile App Scope**

## **3.1.1 Visitor mode**

### **Entry and access model**

Visitors should be able to use the app without creating an account.

The expected visitor flow is:

  - open app
  - allow required permissions
  - land on the map
  - view nearby points
  - select a point
  - open UserView
  - approach the location if needed
  - launch AR
  - consume the content
  - return to map / continue exploring

This low-friction visitor model is one of the main product decisions in the PRD.

### **Permissions and first-use behavior**

The app still needs proper permission logic even if formal privacy/governance modules are out of scope in Phase 1.

Required handling includes:

  - location permission for map, proximity, and creator placement
  - camera permission for AR
  - platform-required media/storage permissions where relevant
  - permission rationale screens
  - denied-state guidance
  - retry / enable-permission flow

This matters for scope because the product cannot function without it.

### **Map discovery and point browsing**

The map is the primary visitor discovery surface.

In scope:

  - map with visible memory point markers
  - tap marker to open point preview
  - open UserView from preview
  - nearby-point exploration
  - move toward selected point
  - support for open-in-maps or navigation continuity

Recommended additions for better usability:

  - nearby list view
  - basic search by point name
  - light filtering by point type
  - clustered markers in dense areas

Search and discovery should remain practical in Phase 1, not overbuilt.

### **UserView / point detail screen**

UserView is an explicit product surface in the PRD and should be treated as more than a simple detail page.

UserView should include:

  - point title
  - short memorial context / description
  - location relevance
  - readiness state
  - primary action to start AR or playback
  - route back to map / exploration

Recommended supporting states:

  - out of range
  - loading
  - processing
  - ready
  - unavailable

This screen is important because it bridges discovery and experience.

### **Proximity and activation logic**

Proximity is a core product rule, not a secondary feature.

The app should support the following states:

  - point visible but far away
  - approaching / within preloading range
  - in activation zone
  - ready to launch AR
  - currently playing
  - unavailable / failed

In scope:

  - distance detection
  - activation threshold logic
  - preloading behavior
  - clear user messaging depending on distance and readiness

This is a meaningful estimation item because it affects mobile logic, backend payloads, and real-world testing.

### **AR experience and playback**

The AR layer is the main differentiator of the product and should be useful, not decorative.

In scope:

  - launch AR from UserView when eligible
  - open camera-based AR scene
  - align AI content with the memory point
  - render AI video and/or avatar in context
  - support basic playback controls
  - allow clean exit back to UserView

The experience should also guide the user when:

  - they are too far from the point
  - tracking is weak
  - AR is not available on the device
  - media is not ready yet

### **Fallback and edge-case handling**

Phase 1 should still include sensible fallback behavior because the app is meant for outdoor real-world use.

Key edge cases to handle:

  - no nearby points
  - denied permissions
  - weak GPS
  - poor connectivity
  - media still processing
  - unsupported AR devices
  - being too far from the point
  - failed media retrieval

Recommended fallback options where feasible:

  - standard non-AR playback
  - audio-first fallback
  - retry actions
  - clear status messaging

This affects both development and QA scope.

## **3.1.2 Creator mode**

### **Authentication and role separation**

Creators use the same mobile app but access creator functionality only after login.

Confirmed Phase 1 rules:

  - email + password only
  - no self-registration
  - no Apple login
  - no Google login
  - account created by admin

Role separation should be explicit so visitor and creator capabilities do not mix in confusing ways.

### **Memory point creation in the field**

The main creator workflow is placing a memory point physically on-site.

In scope:

  - capture current GPS position
  - review current location
  - adjust the point on the map
  - confirm final placement
  - add point title
  - add short description
  - assign point type
  - save as draft or continue into content flow

This is one of the most important workflows in the product because inaccurate placement undermines the visitor experience later.

### **Editing and correction flows**

Creators should be able to correct and maintain points after initial creation.

In scope:

  - open previously created points
  - edit title / description / metadata
  - update coordinates
  - change status where allowed
  - relink or update content reference
  - remove or deactivate points where permitted

This is important because cemetery-based field publishing will require iterative correction.

### **My Points area**

A creator should have access to a simple management view inside the mobile app.

Recommended scope for My Points:

  - list of owned / assigned points
  - status labels
  - last updated date
  - quick open/edit
  - search or filter by status
  - visibility of draft / processing / ready / failed / inactive states

This improves usability and reduces admin dependency for small corrections.

### **Lightweight content linkage**

The mobile app should support a light content handoff model rather than a heavy content production workflow.

Recommended Phase 1 approach:

  - creator places point first
  - creator optionally links an existing content package
  - creator may upload minimal source material where needed
  - point can be marked pending admin completion

This keeps mobile focused on field accuracy and keeps heavier content setup in admin.

### **Mobile support / settings layer**

A lightweight settings or help area is recommended.

Useful content includes:

  - permission status
  - how it works
  - creator login/logout
  - app information
  - privacy placeholder
  - support/help guidance

This can remain simple in Phase 1 but is still useful for pilot readiness.

# **3.2 Admin Web Panel Scope**

## **3.2.1 Admin panel structure**

A practical Phase 1 admin structure would include:

  - Dashboard
  - Creators
  - Memory Points
  - Content / Media
  - AI Assets
  - D-ID Settings
  - Maps / Visibility
  - Logs / Diagnostics
  - Admin Settings

This makes the panel clearer for both estimation and client communication.

## **3.2.2 Admin authentication**

The admin panel needs secure internal login and session management.

In scope:

  - admin login
  - session handling
  - logout
  - clear access errors
  - password recovery / reset flow

Optional multi-factor security can remain future scope unless specifically required.

## **3.2.3 Dashboard**

The dashboard should give a quick operational summary, not heavy analytics.

Recommended dashboard content:

  - total creators
  - total memory points
  - draft / active / inactive point counts
  - AI jobs by status
  - failed jobs
  - recent changes
  - pending content actions
  - map publication issues
  - recent system errors

The purpose is operational clarity, not deep reporting.

## **3.2.4 Creator management**

Admin must be able to control creator access.

In scope:

  - create creator accounts
  - edit creator details
  - reset password
  - enable / disable account
  - view creator status
  - view creator-linked points

Required data should include:

  - name
  - email
  - role
  - status
  - password / reset flow

Recommended safeguards:

  - duplicate email prevention
  - clear status visibility
  - password validation

This area is central because the publishing model depends on admin-issued creator access.

## **3.2.5 Memory point management**

The admin panel needs a central place to review all memory points.

In scope:

  - searchable point list
  - status visibility
  - creator visibility
  - timestamp visibility
  - point type
  - linked asset state
  - map visibility state
  - edit / deactivate / archive actions

Recommended actions:

  - open point detail
  - update metadata
  - inspect coordinates
  - inspect linked content
  - inspect AI asset status
  - review publication readiness
  - archive / deactivate if needed

This is one of the core admin surfaces because it ties location, content, and visibility together.

## **3.2.6 Point detail and correction workflow**

Each memory point should have a structured detail view.

Recommended sections:

  - Overview
  - Location
  - Content
  - AI Assets
  - Logs / History

In scope:

  - metadata review
  - coordinate review and correction
  - content linkage review
  - generation history
  - publication status
  - visibility status
  - issue notes / internal notes

Typical correction actions:

  - move coordinates
  - relink source material
  - re-run generation
  - activate / deactivate
  - archive point

This matters because operational correction is unavoidable in pilot mode.

## **3.2.7 Map review**

Admin should have a map-based review view even if creation happens in mobile.

In scope:

  - map of all points
  - filters by status / type / creator
  - clustering in dense areas
  - duplicate / overlap review
  - area-level visibility review

This helps diagnose:

  - bad placement
  - crowded point areas
  - duplicates
  - visibility inconsistencies

This is particularly relevant in cemetery environments with dense geography.

## **3.2.8 Content and media management**

Admin should manage the source materials used for AI generation and memorial presentation.

In scope:

  - upload source image / video / text
  - preview uploaded files where possible
  - attach media to a point
  - replace source files
  - delete or remove invalid media
  - view completeness of content package

Recommended metadata:

  - linked point
  - media type
  - upload date
  - current file state
  - preview availability

This should stay practical in Phase 1 and not become a full DAM system.

## **3.2.9 AI assets and D-ID management**

Admin should manage the AI-generation pipeline operationally.

In scope:

  - configure D-ID generation inputs
  - trigger / queue generation
  - monitor generation status
  - preview generated outputs
  - approve / select active asset operationally
  - link output to correct point
  - re-run failed generation where allowed

This is essential because asset generation alone is not enough; the product needs reliable asset-to-point linkage.

## **3.2.10 Maps / visibility management**

Because memory points are expected to appear in the Google Maps flow, admin needs visibility controls.

Recommended scope:

  - list of points with map visibility state
  - map publication status
  - external link visibility
  - failed publication state
  - retry / refresh actions where possible

This should support review of:

  - expected to publish
  - pending
  - published
  - failed
  - hidden / inactive

This is important because external map visibility is part of the product promise.

## **3.2.11 Logs and diagnostics**

The system needs operational diagnostics in Phase 1.

In scope:

  - failed AI jobs
  - asset retrieval failures
  - publication / sync issues
  - login failures
  - broken point-to-asset links
  - time-stamped system events

Useful filtering dimensions:

  - by point
  - by creator
  - by error type
  - by time range

This matters because a multi-integration pilot is hard to operate without visibility into failures.

# **3.3 Backend / Central API Scope**

## **3.3.1 Core role**

The Central API should act as the source of truth for the whole platform.

It should centrally manage:

  - user roles and access
  - point lifecycle
  - content linkage
  - AI-generation state
  - map visibility state
  - mobile retrieval logic
  - operational logging

This is important because product rules should not live separately in mobile, admin, and integrations.

## **3.3.2 Authentication and authorization**

In scope:

  - admin authentication
  - creator authentication
  - session / token handling
  - role-based access control
  - account enable / disable logic
  - logout flow
  - basic login audit

Visitor mode remains anonymous and does not require account storage.

## **3.3.3 Memory point data model**

A memory point must be treated as more than a simple map marker.

The backend model should include:

  - point title
  - description
  - coordinates
  - creator ownership
  - status
  - point type
  - media references
  - AI asset references
  - AR metadata
  - map metadata
  - timestamps
  - internal operational state

This is an important scope driver because it means the domain model is composite and stateful.

## **3.3.4 Status model**

A state-driven workflow is required.

Recommended statuses include:

### **Memory point statuses**

  - Draft
  - Pending Content
  - Processing
  - Ready
  - Active
  - Failed
  - Inactive
  - Archived

### **AI asset statuses**

  - Queued
  - Processing
  - Ready
  - Failed
  - Deprecated
  - Archived

### **Creator statuses**

  - Active
  - Disabled
  - Suspended
  - Archived

### **Map visibility statuses**

  - Not Published
  - Pending
  - Published
  - Failed
  - Hidden

This state model improves clarity across UX, admin operations, and background processing.

## **3.3.5 Mobile-facing APIs**

The backend needs APIs for:

  - map point retrieval
  - nearby points
  - point preview
  - UserView payload
  - media readiness
  - creator My Points
  - point creation and editing
  - point status updates
  - content linkage
  - visibility state retrieval

These APIs support stateful product flows, not just content reads.

## **3.3.6 Background jobs and orchestration**

The backend must orchestrate asynchronous workflows such as:

  - D-ID generation requests
  - generation status tracking
  - result retrieval
  - output linking
  - publication / visibility updates
  - retries and failure handling
  - logging and diagnostics flows

This is one of the biggest reasons the backend should not be underestimated.

## **3.3.7 Data and storage layer**

The data layer should support:

  - admin records
  - creator records
  - memory point records
  - content/media records
  - AI asset records
  - AR metadata
  - map metadata
  - log/event records
  - UserView support data

A reasonable implementation assumption is:

  - media binaries stored in object storage
  - metadata and relationships stored in the database

This is consistent with the architecture described in the PRD.

# **3.4 External Integrations Scope**

## **3.4.1 D-ID**

Phase 1 D-ID scope includes:

  - sending source material for generation
  - tracking generation status
  - receiving generated outputs
  - storing asset references
  - linking AI output to memory point
  - retrying or re-running failed jobs where appropriate

Stable generation and reliable playback should be prioritized over advanced live conversational AI.

## **3.4.2 Google ARCore**

Phase 1 ARCore scope includes:

  - opening AR scene
  - anchoring media to real-world point
  - rendering avatar / video in the environment
  - supporting outdoor viewing conditions
  - handling weak tracking states
  - guiding the user when AR is not ready or supported

Because the PRD recommends an Android-first pilot, ARCore should be treated as a central dependency.

## **3.4.3 Google Maps**

Phase 1 Google Maps scope includes:

  - in-app mapping support
  - display of point positions
  - route / open-in-maps behavior
  - visibility of creator-added points in Google Maps flow
  - continuity between Google Maps discovery and MyGhostSpot experience

This integration should be treated as both a discovery layer and an operational publication layer.

## **4. Operational / Business Logic That Impacts Estimation**

## **4.1 Controlled publishing model**

Phase 1 uses a deliberately controlled publishing model.

Key rules:

  - visitors do not register
  - creators cannot self-register
  - creator accounts are created by admin
  - creator login is email + password only

This reduces some public-facing complexity, but increases the importance of:

  - admin tools
  - role separation
  - access control
  - operational governance

## **4.2 Accurate field placement**

A creator is expected to place points at real memorial locations in the field.

This creates important scope implications:

  - GPS alone is not enough
  - map adjustment is needed
  - point correction flow is needed
  - admin map review is useful
  - duplicate / overlap handling becomes relevant in dense areas

This is one of the biggest effort drivers in the product because it directly affects later visitor accuracy.

## **4.3 Asynchronous AI readiness**

Point creation and AI readiness are separate events.

This means the platform must support:

  - draft points
  - pending content states
  - processing states
  - ready states
  - failed states
  - retry logic
  - admin intervention

This affects:

  - backend orchestration
  - screen states
  - logging
  - creator flows
  - admin workflows
  - visitor messaging

## **4.4 Proximity-based experience gating**

The visitor experience is location-gated.

This means the product needs:

  - distance awareness
  - trigger thresholds
  - preload logic
  - in-range / out-of-range states
  - guidance when user is not close enough
  - testing for GPS drift scenarios

This has real impact on mobile logic and QA effort.

## **4.5 Outdoor conditions**

The product is expected to work outdoors in real memorial environments.

That means scope should account for:

  - glare
  - movement
  - imperfect connectivity
  - variable GPS precision
  - mixed device support
  - AR tracking inconsistency

These factors make fallback behavior and operational support important, even in Phase 1.

## **4.6 Google Maps publication logic**

Google Maps visibility is not a cosmetic add-on.

It introduces:

  - visibility state
  - publication / sync handling
  - mismatch handling between internal and external state
  - support tools for failed visibility
  - admin review of publication status

This should be estimated as real logic, not just a map embed.

## **4.7 Recommended internal delivery slices**

A sensible internal Phase 1 rollout would be:

1.  **Foundation**
      
      - auth
      - roles
      - map setup
      - core backend
      - base data model
2.  **Creation and Control**
      
      - creator point creation
      - creator My Points
      - admin account management
      - admin point management
3.  **AI and Experience**
      
      - D-ID pipeline
      - UserView
      - AR launch
      - AI playback
4.  **Visibility and Pilot Hardening**
      
      - Google Maps flow
      - logs / diagnostics
      - correction flows
      - fallbacks
      - real-world reliability improvements

This sequence matches the real dependency structure described in the PRD.

## **5. What Should Be Treated as Future Scope**

## **5.1 Public growth features**

The following should be treated as future scope:

  - public registration
  - creator self-service onboarding
  - open community publishing
  - broad user-generated publishing network
  - social/community features

These features add complexity before the core product loop is proven.

## **5.2 Richer visitor engagement**

Future scope items include:

  - advanced search and filtering
  - recommendation/personalization
  - push notifications
  - social sharing
  - richer revisit/history features
  - more advanced discovery logic

These can be added after the location-based core loop is validated.

## **5.3 Advanced AI experiences**

Future AI scope includes:

  - real-time conversational avatar depth
  - more advanced agent interaction
  - richer voice behavior
  - more dynamic AI personalities

For Phase 1, stable generation and playback should take priority.

## **5.4 Broader platform expansion**

The following should be kept outside Phase 1 unless specifically required:

  - broader platform parity beyond Android-first pilot
  - deeper unsupported-device experiences
  - deeper offline authoring
  - broad multi-language support
  - wider commercial expansion features

The PRD supports a controlled pilot framing before scaling wider.

## **5.5 Heavier admin tooling**

The admin console should not become, in Phase 1:

  - a full CMS
  - an enterprise BI platform
  - a full digital asset management system
  - a complex moderation engine
  - a privacy/governance operations platform

Those layers can be added later once the core product works in the field.

## **5.6 Nice-to-have items that can remain secondary**

These are useful, but should not be treated as Phase 1 blockers:

  - duplicate point warning
  - audio-only fallback
  - unsupported-device fallback polish
  - deeper search features
  - more advanced creator My Points tools
  - richer admin previews
  - advanced coordinate validation
  - day/night presentation logic

They can be included if timeline and budget allow, but should remain secondary to the core loop.

## **Client-Facing Summary**

MyGhostSpot Phase 1 should be delivered as a focused, controlled memorial AR pilot built to validate one complete user and operational loop. The scope includes a mobile app for visitors and approved creators, an admin panel for internal control, a central backend for orchestration, and the required integrations for AI generation, AR rendering, and map visibility. The commercial logic of this phase is to prove that real memorial locations can be turned into meaningful on-site digital experiences through accurate field placement, reliable AI-to-point linkage, frictionless visitor access, and practical operational oversight. By keeping the first release curated and disciplined, the project stays realistic to estimate, strong enough to pilot, and well positioned for future expansion.
