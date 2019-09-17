const db = require('./db');

const Query = {
    // job: (root, args) => db.jobs.get(args.id),
    job: (root, {id}) => db.jobs.get(id),
    jobs: () => db.jobs.list(),
    company: (root, {id}) => db.companies.get(id)
};

const Mutation = {
    createJob: (root, {input}, {user}) => {
        if (!user) {
            throw new Error('Unauthorized');
        }
        const id = db.jobs.create({companyId: user.companyId, ...input});
        return db.jobs.get(id);
    }
}

const Company = {
    //object: (parent) => db query
    jobs: (company) => db.jobs.list()
        .filter((job) => job.companyId === company.id)
}

const Job = {
    //object: (parent) => db query
    company: (job) => db.companies.get(job.companyId)
}

module.exports = { Query, Mutation, Company, Job };