
import React, { useMemo, useState } from "react";
import {
  Search, Rocket, FolderKanban, ClipboardList, Users,
  Github, Bell, Settings, ShieldCheck, ChevronDown,
  CircleHelp, ArrowRight
} from "lucide-react";
import "./HelpCenter.css";

const articles = [
  {
    category: "Getting Started",
    icon: Rocket,
    color: "violet",
    title: "Getting started with DevPulse",
    description: "Learn the basics of your workspace.",
    questions: [
      ["What is DevPulse?", "DevPulse is a project and task management workspace that helps developers organize projects, track tasks, and manage their development workflow."],
      ["How do I get started?", "Log in to your account, explore the dashboard, create a project, and add tasks to organize your work."],
      ["Where can I find my projects?", "Open Projects from the sidebar to view and manage your available projects."]
    ]
  },
  {
    category: "Projects",
    icon: FolderKanban,
    color: "blue",
    title: "Projects and workspace",
    description: "Create projects and organize your work.",
    questions: [
      ["How do I create a project?", "Open Projects or use the New Project action on your dashboard. Complete the required details and save your project."],
      ["Why can't I see my project?", "Check that you are logged into the correct account, refresh the Projects page, and verify that the project was saved successfully."],
      ["How do I view project tasks?", "Open the relevant project and use its task-viewing action, if available."]
    ]
  },
  {
    category: "Tasks",
    icon: ClipboardList,
    color: "green",
    title: "Tasks and progress",
    description: "Organize work and track task status.",
    questions: [
      ["How do I create a task?", "Open Tasks, select the available task creation action, complete the required information, and save the task."],
      ["Why are my tasks missing?", "Check your project selection and filters. Make sure the tasks were saved and are accessible to your account."],
      ["How should I organize tasks?", "Use clear titles, helpful descriptions, and the available project and status options."]
    ]
  },
  {
    category: "Team",
    icon: Users,
    color: "orange",
    title: "Team collaboration",
    description: "Find team features and collaboration guidance.",
    questions: [
      ["Where can I find team features?", "Open Team from the sidebar to access the team features available in your workspace."],
      ["Why can't I access a team feature?", "The feature may depend on your account permissions or the functionality enabled in your workspace."]
    ]
  },
  {
    category: "GitHub",
    icon: Github,
    color: "slate",
    title: "GitHub integration",
    description: "Troubleshoot your development integration.",
    questions: [
      ["Where do I find GitHub features?", "Open GitHub from the Developer Tools section of the sidebar."],
      ["Why isn't GitHub data appearing?", "Check your internet connection, repository configuration, account permissions, and any displayed authentication errors."]
    ]
  },
  {
    category: "Notifications",
    icon: Bell,
    color: "pink",
    title: "Notifications and activity",
    description: "Understand updates and recent activity.",
    questions: [
      ["Where can I find notifications?", "Use the notification control in the top navigation or open the relevant activity section."],
      ["Why is an activity missing?", "Verify that the action completed successfully and that the event is supported by the application."]
    ]
  },
  {
    category: "Account & Security",
    icon: ShieldCheck,
    color: "blue",
    title: "Account and security",
    description: "Get help with login, settings, and safety.",
    questions: [
      ["What if I cannot log in?", "Verify your email and password, check your connection, and try again. Contact your administrator if the issue continues."],
      ["How do I sign out?", "Use the sign-out control near your profile at the bottom of the sidebar."],
      ["How can I keep my account secure?", "Keep your credentials private, use a strong password, and always sign out on shared devices."]
    ]
  },
  {
    category: "Troubleshooting",
    icon: Settings,
    color: "slate",
    title: "Common problems",
    description: "Solutions for common application issues.",
    questions: [
      ["The website is loading slowly. What should I do?", "Check your internet connection and retry. If the problem persists, record the affected page and report the issue."],
      ["I see an error on the page. What information should I report?", "Include the page name, steps to reproduce the problem, the exact error message, and a screenshot if possible. Never include passwords or access tokens."]
    ]
  }
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return articles;

    return articles
      .map((article) => ({
        ...article,
        questions: article.questions.filter(([question, answer]) =>
          `${article.title} ${article.description} ${question} ${answer}`
            .toLowerCase()
            .includes(term)
        )
      }))
      .filter((article) =>
        article.title.toLowerCase().includes(term) ||
        article.description.toLowerCase().includes(term) ||
        article.questions.length > 0
      );
  }, [search]);

  return (
    <div className="help-page">
      <section className="help-hero">
        <div className="help-hero-icon"><CircleHelp size={25} /></div>
        <p className="help-eyebrow">DEVPULSE SUPPORT</p>
        <h1>How can we help?</h1>
        <p className="help-subtitle">
          Find answers, explore features, and get more out of your workspace.
        </p>

        <div className="help-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenQuestion(null);
            }}
            placeholder="Search help articles..."
            aria-label="Search help articles"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              Clear
            </button>
          )}
        </div>
        <p className="help-search-hint">
          Try searching for projects, tasks, login, or GitHub.
        </p>
      </section>

      {!search && (
        <section className="help-section">
          <div className="help-section-heading">
            <div>
              <p className="help-eyebrow">BROWSE TOPICS</p>
              <h2>Explore the Help Center</h2>
            </div>
            <span>{articles.length} categories</span>
          </div>

          <div className="help-category-grid">
            {articles.map((article) => {
              const Icon = article.icon;
              return (
                <button
                  type="button"
                  className="help-category-card"
                  key={article.category}
                  onClick={() =>
                    document.getElementById(
                      `help-${article.category.replace(/[^a-z0-9]/gi, "-")}`
                    )?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span className={`help-category-icon ${article.color}`}>
                    <Icon size={21} />
                  </span>
                  <strong>{article.title}</strong>
                  <span className="help-category-description">
                    {article.description}
                  </span>
                  <span className="help-card-link">
                    Explore articles <ArrowRight size={15} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="help-section help-articles">
        <div className="help-section-heading">
          <div>
            <p className="help-eyebrow">
              {search ? "SEARCH RESULTS" : "HELP ARTICLES"}
            </p>
            <h2>{search ? `Results for "${search}"` : "Popular questions"}</h2>
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="help-empty">
            <Search size={26} />
            <h3>No articles found</h3>
            <p>Try another keyword, such as “tasks” or “account”.</p>
            <button onClick={() => setSearch("")}>View all articles</button>
          </div>
        ) : (
          filteredArticles.map((article) => {
            const Icon = article.icon;
            const sectionId = `help-${article.category.replace(/[^a-z0-9]/gi, "-")}`;

            return (
              <div
                className="help-article-group"
                id={sectionId}
                key={article.category}
              >
                <div className="help-article-heading">
                  <span className={`help-category-icon ${article.color}`}>
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                  </div>
                </div>

                <div className="help-question-list">
                  {article.questions.map(([question, answer]) => {
                    const id = `${article.category}-${question}`;
                    const isOpen = openQuestion === id;

                    return (
                      <div className="help-question" key={id}>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenQuestion(isOpen ? null : id)
                          }
                        >
                          <span>{question}</span>
                          <ChevronDown
                            size={18}
                            className={isOpen ? "help-chevron open" : "help-chevron"}
                          />
                        </button>
                        {isOpen && (
                          <div className="help-answer">{answer}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="help-contact">
        <div className="help-contact-icon"><CircleHelp size={23} /></div>
        <div>
          <h2>Still need help?</h2>
          <p>
            If the issue continues, contact your DevPulse administrator.
            Include the affected page and error message, but never share passwords
            or access tokens.
          </p>
        </div>
      </section>
    </div>
  );
}
