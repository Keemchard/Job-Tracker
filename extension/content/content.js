(() => {
  if (document.getElementById("jt-fab")) return;

  const SCRAPERS = {
    linkedin: {
      test: () => location.hostname.includes("linkedin.com"),
      scrape: () => {
        const getText = (...selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return "";
        };

        return {
          position: getText(
            ".job-details-jobs-unified-top-card__job-title h1",
            ".job-details-jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title",
            ".topcard__title",
            "h1.t-24",
            "h1"
          ),
          company: getText(
            ".job-details-jobs-unified-top-card__company-name a",
            ".job-details-jobs-unified-top-card__company-name",
            ".jobs-unified-top-card__company-name a",
            ".topcard__org-name-link",
            'a[data-tracking-control-name="public_jobs_topcard-org-name"]'
          ),
          location: getText(
            ".job-details-jobs-unified-top-card__bullet",
            ".jobs-unified-top-card__bullet",
            ".topcard__flavor--bullet",
            'span.tvm__text.tvm__text--low-emphasis'
          ),
          workMode: detectWorkMode(),
          jobUrl: cleanLinkedInUrl(location.href),
        };
      },
    },

    indeed: {
      test: () => location.hostname.includes("indeed.com"),
      scrape: () => {
        const getText = (...selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return "";
        };

        return {
          position: getText(
            'h1[class*="jobTitle"]',
            ".jobsearch-JobInfoHeader-title",
            '[data-testid="jobsearch-JobInfoHeader-title"]',
            "h1"
          ),
          company: getText(
            '[data-testid="inlineHeader-companyName"] a',
            '[data-testid="inlineHeader-companyName"]',
            '[data-company-name]',
            ".jobsearch-InlineCompanyRating-companyHeader a",
            ".jobsearch-InlineCompanyRating-companyHeader"
          ),
          location: getText(
            '[data-testid="inlineHeader-companyLocation"]',
            '[data-testid="job-location"]',
            ".jobsearch-JobInfoHeader-subtitle > div:last-child"
          ),
          workMode: detectWorkMode(),
          jobUrl: location.href.split("&")[0],
        };
      },
    },

    kalibrr: {
      test: () => location.hostname.includes("kalibrr.com"),
      scrape: () => {
        const getText = (...selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return "";
        };

        return {
          position: getText(
            "h1.css-1ypoelj",
            'h1[class*="JobDescription"]',
            ".k-font-title",
            "h1"
          ),
          company: getText(
            'a[class*="CompanyName"]',
            ".k-company-name a",
            ".k-company-name",
            'h2 a[href*="/c/"]',
            "h2"
          ),
          location: getText(
            '[class*="LocationWrapper"]',
            ".k-job-card__location",
            'span[class*="location"]',
            'div[class*="Meta"] span'
          ),
          workMode: detectWorkMode(),
          jobUrl: location.href,
        };
      },
    },
  };

  function detectWorkMode() {
    const text = document.body.innerText.toLowerCase();
    if (text.includes("remote") && text.includes("hybrid")) return "hybrid";
    if (/\bremote\b/.test(text)) return "remote";
    if (/\bhybrid\b/.test(text)) return "hybrid";
    return "onsite";
  }

  function cleanLinkedInUrl(url) {
    try {
      const u = new URL(url);
      u.search = "";
      return u.toString();
    } catch {
      return url;
    }
  }

  function getScraper() {
    for (const [name, scraper] of Object.entries(SCRAPERS)) {
      if (scraper.test()) return { name, ...scraper };
    }
    return null;
  }

  const scraper = getScraper();
  if (!scraper) return;

  // Floating action button
  const fab = document.createElement("button");
  fab.id = "jt-fab";
  fab.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobTracker`;
  fab.title = "Save this job to JobTracker";
  document.body.appendChild(fab);

  // Panel overlay
  const panel = document.createElement("div");
  panel.id = "jt-panel";
  panel.innerHTML = `
    <div class="jt-panel-content">
      <div class="jt-panel-header">
        <h3>Save to JobTracker</h3>
        <button class="jt-panel-close">&times;</button>
      </div>
      <div class="jt-panel-body">
        <div class="jt-field">
          <label>Company</label>
          <input type="text" id="jt-company" placeholder="Company name" />
        </div>
        <div class="jt-field">
          <label>Position</label>
          <input type="text" id="jt-position" placeholder="Job title" />
        </div>
        <div class="jt-field">
          <label>Location</label>
          <input type="text" id="jt-location" placeholder="City, Country" />
        </div>
        <div class="jt-row">
          <div class="jt-field">
            <label>Work Mode</label>
            <select id="jt-workmode">
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div class="jt-field">
            <label>Salary</label>
            <input type="text" id="jt-salary" placeholder="Optional" />
          </div>
        </div>
        <div class="jt-field">
          <label>Notes</label>
          <textarea id="jt-notes" placeholder="Optional notes..." rows="2"></textarea>
        </div>
      </div>
      <div class="jt-panel-footer">
        <div id="jt-status" class="jt-status"></div>
        <button id="jt-save" class="jt-save-btn">Save Application</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Event handlers
  fab.addEventListener("click", () => {
    const data = scraper.scrape();
    document.getElementById("jt-company").value = data.company || "";
    document.getElementById("jt-position").value = data.position || "";
    document.getElementById("jt-location").value = data.location || "";
    document.getElementById("jt-workmode").value = data.workMode || "onsite";
    panel.dataset.jobUrl = data.jobUrl || location.href;
    panel.classList.add("jt-visible");
  });

  panel.querySelector(".jt-panel-close").addEventListener("click", () => {
    panel.classList.remove("jt-visible");
  });

  panel.addEventListener("click", (e) => {
    if (e.target === panel) panel.classList.remove("jt-visible");
  });

  document.getElementById("jt-save").addEventListener("click", async () => {
    const saveBtn = document.getElementById("jt-save");
    const status = document.getElementById("jt-status");
    const company = document.getElementById("jt-company").value.trim();
    const position = document.getElementById("jt-position").value.trim();

    if (!company || !position) {
      status.textContent = "Company and position are required.";
      status.className = "jt-status jt-error";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    status.textContent = "";

    const jobData = {
      company,
      position,
      location: document.getElementById("jt-location").value.trim(),
      workMode: document.getElementById("jt-workmode").value,
      salary: document.getElementById("jt-salary").value.trim(),
      notes: document.getElementById("jt-notes").value.trim(),
      jobUrl: panel.dataset.jobUrl || location.href,
    };

    chrome.runtime.sendMessage(
      { action: "saveApplication", data: jobData },
      (response) => {
        if (response?.success) {
          status.textContent = "Saved!";
          status.className = "jt-status jt-success";
          saveBtn.textContent = "Saved!";
          setTimeout(() => {
            panel.classList.remove("jt-visible");
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Application";
            status.textContent = "";
            status.className = "jt-status";
          }, 1500);
        } else {
          const err = response?.error || "Unknown error";
          if (err === "NOT_CONFIGURED") {
            status.textContent = "Open the extension popup and configure your Firebase settings.";
          } else if (err === "NOT_AUTHENTICATED") {
            status.textContent = "Open the extension popup and sign in first.";
          } else {
            status.textContent = `Error: ${err}`;
          }
          status.className = "jt-status jt-error";
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Application";
        }
      }
    );
  });
})();
