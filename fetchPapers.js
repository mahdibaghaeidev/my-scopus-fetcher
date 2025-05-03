import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SCOPUS_AUTHOR_ID = "59361198200";

const fetchScopusPapers = async () => {
  try {
    const response = await axios.get(
      `https://api.elsevier.com/content/search/scopus?query=AU-ID(${SCOPUS_AUTHOR_ID})`,
      {
        headers: {
          "X-ELS-APIKey": process.env.ELSEVIER_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const results = response.data["search-results"]?.entry || [];

    if (!results.length) {
      console.log("⚠️ No papers found for this author ID.");
      return;
    }

    results.forEach((paper, index) => {
      console.log(`${index + 1}. ${paper["dc:title"]}`);
    });
  } catch (error) {
    console.error("Error fetching Scopus papers:", error.message);
  }
};

fetchScopusPapers();
