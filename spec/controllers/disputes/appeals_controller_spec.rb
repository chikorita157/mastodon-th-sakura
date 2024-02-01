# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Disputes::AppealsController do
  render_views

  before { sign_in current_user, scope: :user }

  let!(:admin) { Fabricate(:user, role: UserRole.find_by(name: 'Admin')) }

  describe '#create' do
    context 'with valid params' do
      let(:current_user) { Fabricate(:user) }
      let(:strike) { Fabricate(:account_warning, target_account: current_user.account) }

      before do
        post :create, params: { strike_id: strike.id, appeal: { text: 'Foo' } }
      end

      it 'notifies staff about new appeal', :sidekiq_inline do
        expect(ActionMailer::Base.deliveries.first.to).to eq([admin.email])
      end

      it 'redirects back to the strike page' do
        expect(response).to redirect_to(disputes_strike_path(strike.id))
      end
    end

    context 'with invalid params' do
      let(:current_user) { Fabricate(:user) }
      let(:strike) { Fabricate(:account_warning, target_account: current_user.account) }

      before do
        post :create, params: { strike_id: strike.id, appeal: { text: '' } }
      end

      it 'does not send email', :sidekiq_inline do
        expect(ActionMailer::Base.deliveries.size).to eq(0)
      end

      it 'renders the strike show page' do
        expect(response).to render_template('disputes/strikes/show')
      end
    end
  end
end
