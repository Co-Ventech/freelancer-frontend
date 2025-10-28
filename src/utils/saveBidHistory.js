import axios from "axios";

export const saveBidHistory = async ({ url, projectId, bidderId, projectType, amount, period, description, bidderType, projectDescription, projectTitle, budget }) => {
    console.log(period, amount)
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/save-bid-history`, {
            project_id: projectId,
            bidder_id: bidderId,
            amount,
            projectDescription: projectDescription,
            projectTitle: projectTitle,
            period,
            url,
            description,
            type: projectType,
            bidder_type: bidderType,
            budget,
            date: new Date().toISOString()

        });

        console.log(`Bid history saved for project ${projectId}:`, response.data);
    } catch (err) {
        console.error(`Failed to save bid history for project ${projectId}:`, err);
    }
};